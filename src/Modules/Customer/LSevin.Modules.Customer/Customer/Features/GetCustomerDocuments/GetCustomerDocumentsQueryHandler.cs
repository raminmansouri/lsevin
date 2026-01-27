using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using Dapper;

namespace LSevin.Modules.Customer.Customer.Features.GetCustomerDocuments;

internal sealed class GetCustomerDocumentsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IUserAccessor userAccessor
) : IQueryHandler<GetCustomerDocumentsQuery, IReadOnlyCollection<GetCustomerDocumentsResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetCustomerDocumentsResponse>>> Handle(
        GetCustomerDocumentsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        const string sql = $"""
            SELECT
                cd.id AS {nameof(GetCustomerDocumentsResponse.Id)},
                cdt.name AS {nameof(GetCustomerDocumentsResponse.Type)},
                cd.document_url AS {nameof(GetCustomerDocumentsResponse.Url)}
            FROM customer.customer_documents cd
            JOIN customer.customer_document_types cdt ON cd.document_type_id = cdt.id
            JOIN customer.customers c ON cd.customer_id = c.id
            WHERE c.id = @UserId
            """;

        var documents = await connection.QueryAsync<GetCustomerDocumentsResponse>(
            new CommandDefinition(
                sql,
                new { UserId = userAccessor.GetUserIdentity },
                cancellationToken: cancellationToken
            )
        );

        return documents.AsList();
    }
}
