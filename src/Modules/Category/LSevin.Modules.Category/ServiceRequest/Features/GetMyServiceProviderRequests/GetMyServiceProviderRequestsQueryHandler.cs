using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetMyServiceProviderRequests;

internal sealed class GetMyServiceProviderRequestsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IUserAccessor userAccessor
) : IQueryHandler<GetMyServiceProviderRequestsQuery, IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>> Handle(
        GetMyServiceProviderRequestsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var sql =
            @"SELECT spr.id AS Id,
                           spr.service_provider_id AS ServiceProviderId,
                           spr.customer_id AS CustomerId,
                           spr.customer_email AS CustomerEmail,
                           spr.customer_full_name AS CustomerFullName,
                           spr.message AS Message,
                           rs.name AS Status,
                           spr.create_date AS CreateDate,
                           spr.last_modified_date AS LastModifiedDate
                    FROM category.service_provider_requests spr
                    INNER JOIN category.service_provider_request_statuses rs ON rs.id = spr.request_status_id
                    WHERE spr.service_provider_id = @ServiceProviderId AND spr.customer_id = @CustomerId
                    ORDER BY spr.create_date DESC";

        var rows = await connection.QueryAsync<GetMyServiceProviderRequestsResponse>(
            new CommandDefinition(
                sql,
                new { ServiceProviderId = request.ServiceProviderId, CustomerId = userAccessor.GetUserIdentity },
                cancellationToken: cancellationToken
            )
        );

        return rows.AsList();
    }
}
