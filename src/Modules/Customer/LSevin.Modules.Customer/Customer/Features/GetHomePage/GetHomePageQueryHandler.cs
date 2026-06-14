using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using QuickType;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetHomePageQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<GetHomePageQuery, GetHomePageResponse>
{
    public async Task<Result<GetHomePageResponse>> Handle(
        GetHomePageQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("GetHomePage Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

   
        var searchHistoryResponse = GetHomePageResponse.FromJson(GetHomePageResponse.SampleJson);


        return searchHistoryResponse;
    }



    public async Task<GetHomePageResponse> GetHomePageAsync(
        string language,
        string fallbackLanguage = "en",
        int quickSearchCount = 8,
        CancellationToken cancellationToken = default)
    {
        await using var _connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        const string sql = """
            -- 1) Categories
            SELECT
                c.id AS Id,
                common.get_translation_t(c.name_translations, @Language, @FallbackLanguage) AS Label,

                -- Since schema has no "path" column, derive it from translated label
                lower(
                    regexp_replace(
                        btrim(common.get_translation_t(c.name_translations, @Language, @FallbackLanguage)),
                        '\s+',
                        '-',
                        'g'
                    )
                ) AS Path,

                COALESCE(c.image_url, '') AS Image,
                COALESCE(c.gradient, '') AS Gradient
            FROM category.categories c
            WHERE c.is_active = TRUE
            ORDER BY c.display_order, common.get_translation_t(c.name_translations, @Language, @FallbackLanguage);

            -- 2) Quick searches
            SELECT DISTINCT ts.term
            FROM search.trending_searches ts
            WHERE ts.term IS NOT NULL
              AND btrim(ts.term) <> ''
            ORDER BY ts.term
            LIMIT @QuickSearchCount;
            """;

        var command = new CommandDefinition(
            sql,
            new
            {
                Language = language,
                FallbackLanguage = fallbackLanguage,
                QuickSearchCount = quickSearchCount
            },
            cancellationToken: cancellationToken);

        using var multi = await _connection.QueryMultipleAsync(command);

        var categories = (await multi.ReadAsync<HomePageCategoryRow>())
            .Select(x => new HomePageCategory
            {
                Id = x.Id,
                Label = x.Label,
                Path = x.Path,
                Image = x.Image,
                Gradient = x.Gradient
            })
            .ToArray();

        var quickSearches = (await multi.ReadAsync<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new GetHomePageResponse
        {
            Categories = categories,
            QuickSearches = quickSearches
        };
    }
}

