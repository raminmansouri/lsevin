using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevinModels.Models;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchResultsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IDbContextFactory<LsevinContext> contextFactory,
    IUserAccessor userAccessor,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetSearchResultsQuery, GetSearchResultsResponse>
{
    public async Task<Result<GetSearchResultsResponse>> Handle(
        GetSearchResultsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var response = await Search(connection, request.term, userAccessor.GetUserIdentity.ToString());

        return response;
    }

    // Ranked full-text search (search_vector, GIN-indexed) blended with trigram
    // similarity (search_text, GIN-indexed) for typo/short-term tolerance.
    // Postgres combines both GIN indexes via a BitmapOr scan — no sequential scan.
    public static string DapperSQL = @"
WITH q AS (
    SELECT
        plainto_tsquery('english', @Term)  AS tsq,
        lower(trim(@Term))                 AS trgm_term
)
(
    SELECT
        ps.id::text                          AS ""Id"",
        'service'                            AS ""Type"",
        ps.display_name_translations->>'en-US' AS ""Name"",
        sp.name_translations->>'en-US'       AS ""Provider"",
        NULL                                 AS ""Image"",
        sp.city || ', ' || sp.country        AS ""Location"",
        COALESCE(ps.rating, 0)::float        AS ""Rating"",
        COALESCE(ps.review_count, 0)         AS ""Reviews"",
        ps.value::int                        AS ""Price"",
        ps.value::int                        AS ""OriginalPrice"",
        sp.is_active                         AS ""Verified"",
        NULL                                 AS ""Tags"",
        NULL                                 AS ""Specialties"",
        c.id::text                           AS ""CategoryId"",
        c.name_translations->>'en-US'        AS ""CategoryLabel"",
        (
            COALESCE(ts_rank(ps.search_vector, q.tsq), 0)
            + COALESCE(similarity(ps.search_text, q.trgm_term), 0)
        )                                     AS ""Rank""
    FROM category.provider_services ps
    CROSS JOIN q
    JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
    LEFT JOIN category.service_definitions sd
        ON sd.id = ps.service_definition_id
    LEFT JOIN category.categories c
        ON c.id = sd.category_id
    WHERE
        ps.is_active = true
        AND (
            ps.search_vector @@ q.tsq
            OR ps.search_text % q.trgm_term
        )
    ORDER BY ""Rank"" DESC
    LIMIT 20
)
UNION ALL
(
    SELECT
        sp.id::text                    AS ""Id"",
        'provider'                     AS ""Type"",
        sp.name_translations->>'en-US' AS ""Name"",
        sp.name_translations->>'en-US' AS ""Provider"",
        gallery.url                    AS ""Image"",
        sp.city || ', ' || sp.country  AS ""Location"",
        COALESCE(sp.rating, 0)::float  AS ""Rating"",
        COALESCE(sp.review_count, 0)   AS ""Reviews"",
        0                              AS ""Price"",
        0                              AS ""OriginalPrice"",
        sp.is_active                   AS ""Verified"",
        NULL                           AS ""Tags"",
        NULL                           AS ""Specialties"",
        NULL                           AS ""CategoryId"",
        NULL                           AS ""CategoryLabel"",
        (
            COALESCE(ts_rank(sp.search_vector, q.tsq), 0)
            + COALESCE(similarity(sp.search_text, q.trgm_term), 0)
        )                               AS ""Rank""
    FROM category.service_providers sp
    CROSS JOIN q
    LEFT JOIN LATERAL (
        SELECT url
        FROM category.provider_gallery_items g
        WHERE g.service_provider_id = sp.id
        ORDER BY g.display_order
        LIMIT 1
    ) gallery ON true
    WHERE
        sp.is_active = true
        AND (
            sp.search_vector @@ q.tsq
            OR sp.search_text % q.trgm_term
        )
    ORDER BY ""Rank"" DESC
    LIMIT 10
)
ORDER BY ""Rank"" DESC
LIMIT 30;
";

    private static readonly string InsertHistorySql = @"
INSERT INTO search.user_search_history (user_id, term, normalized_term, created_at)
VALUES (@UserId, @Term, @NormalizedTerm, now());
";

    private static readonly string RecentSql = @"
SELECT DISTINCT term
FROM search.user_search_history
WHERE user_id = @UserId
ORDER BY term
LIMIT 5;
";

    public async Task<GetSearchResultsResponse> Search(
        IDbConnection db,
        string term,
        string userId)
    {
        var trimmedTerm = term.Trim();

        var results = (
            await db.QueryAsync<SearchResultItem>(
                DapperSQL,
                new { Term = trimmedTerm })
        ).ToList();

        var categories = results
            .Where(x => x.Type == "service")
            .Select(x => new SearchResultCategory
            {
                Id = x.CategoryId,
                Label = x.CategoryLabel
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .GroupBy(x => x.Id)
            .Select(x => x.First())
            .ToList();

        var recent = (
            await db.QueryAsync<string>(RecentSql, new { UserId = userId })
        ).ToArray();

        // Record the search so GetSearchHistory (recent/trending) is no longer
        // permanently empty. Failure here must never break the search response.
        try
        {
            var normalizedTerm = string.Join(
                ' ',
                trimmedTerm.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries)
            );

            await db.ExecuteAsync(
                InsertHistorySql,
                new
                {
                    UserId = userId,
                    Term = trimmedTerm,
                    NormalizedTerm = normalizedTerm
                });
        }
        catch
        {
            // logging hook goes here — intentionally swallowed so a history-write
            // failure never fails the user's search request.
        }

        return new GetSearchResultsResponse
        {
            Results = results,
            Categories = categories,
            Filters =
            [
                new() { Id = "verified", Label = "Verified" },
                new() { Id = "top_rated", Label = "Top Rated" },
                new() { Id = "low_price", Label = "Lowest Price" }
            ],
            RecentSearches = recent
        };
    }
}
