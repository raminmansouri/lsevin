using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.GetCommentsByServiceProvider;

internal sealed class GetCommentsByServiceProviderQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IUserAccessor userAccessor
) : IQueryHandler<GetCommentsByServiceProviderQuery, IPageList<GetCommentsByServiceProviderResponse>>
{
    private static readonly List<string> _searchColumns = ["c.customer_name", "c.comment_text"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetCommentsByServiceProviderResponse.CustomerName),
        nameof(GetCommentsByServiceProviderResponse.Rating),
        nameof(GetCommentsByServiceProviderResponse.CreateDate),
    ];
    private const string FallbackSortColumn = "c.create_date";
    private const string FallbackSortDirection = "DESC";

    public async Task<Result<IPageList<GetCommentsByServiceProviderResponse>>> Handle(
        GetCommentsByServiceProviderQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        var currentUserId = userAccessor.GetUserIdentity;
        parameters.Add("CurrentUserId", currentUserId); // Used in SELECT for IsMine

        var baseFromBuilder = BuildBaseFromClause();
        ApplyFilters(baseFromBuilder, request, parameters);

        // Count Query
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(c.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetCommentsByServiceProviderResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(
            request,
            _allowedSortColumns,
            FallbackSortColumn,
            FallbackSortDirection,
            ensureDeterministicOrder: true
        );

        dataQueryBuilder.AppendPaging(request, parameters);

        var comments = await connection.QueryAsync<GetCommentsByServiceProviderResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        return PageList<GetCommentsByServiceProviderResponse>.Create(
            comments.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
        );
    }

    private static string GetSelectClause()
    {
        return $"""
            c.id AS {nameof(GetCommentsByServiceProviderResponse.Id)},
            c.service_provider_id AS {nameof(GetCommentsByServiceProviderResponse.ServiceProviderId)},
            c.customer_id AS {nameof(GetCommentsByServiceProviderResponse.CustomerId)},
            c.customer_name AS {nameof(GetCommentsByServiceProviderResponse.CustomerName)},
            c.comment_text AS {nameof(GetCommentsByServiceProviderResponse.CommentText)},
            c.rating AS {nameof(GetCommentsByServiceProviderResponse.Rating)},
            CASE WHEN c.customer_id = @CurrentUserId THEN true ELSE false END AS {nameof(
                GetCommentsByServiceProviderResponse.IsMine
            )},
            c.create_date AS {nameof(GetCommentsByServiceProviderResponse.CreateDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_provider_comments c
            WHERE c.is_public = true
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetCommentsByServiceProviderQuery request,
        DynamicParameters parameters
    )
    {
        // Filter by service provider (required)
        baseFromBuilder.AppendWhereOrAnd("c.service_provider_id = @ServiceProviderId");
        parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            baseFromBuilder.AppendSearchFilter(request.Filters, _searchColumns, parameters);
        }

        // Apply date range filters if provided
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            baseFromBuilder.AppendDateRange(request.StartDate, request.EndDate, "c.create_date", parameters);
        }
    }
}
