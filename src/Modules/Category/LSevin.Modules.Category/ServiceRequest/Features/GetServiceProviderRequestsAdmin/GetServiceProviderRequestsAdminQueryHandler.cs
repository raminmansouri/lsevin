using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsAdmin;

internal sealed class GetServiceProviderRequestsAdminQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetServiceProviderRequestsAdminQuery, IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>> Handle(
        GetServiceProviderRequestsAdminQuery request,
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
                    WHERE spr.service_provider_id = @ServiceProviderId
                    ORDER BY spr.create_date DESC";

        var rows = await connection.QueryAsync<GetServiceProviderRequestsAdminResponse>(
            new CommandDefinition(
                sql,
                new { ServiceProviderId = request.ServiceProviderId },
                cancellationToken: cancellationToken
            )
        );

        return rows.AsList();
    }
}
