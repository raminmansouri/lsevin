using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Services;

internal sealed class CustomerDocumentCheckerService(IDbConnectionFactory dbConnectionFactory)
    : ICustomerDocumentCheckerService
{
    public Result<bool> ContainsAll(CustomerId customerId, IReadOnlyCollection<CustomerDocumentId> documentIds)
    {
        using var connection = dbConnectionFactory.GetOrCreateConnection();

        var sql = $"""
            SELECT
                id
            FROM
                customer.customer_documents
            WHERE
                customer_id = @CustomerId AND
                id IN ({string.Join(", ", documentIds.Select(id => $"'{id.Value}'"))})
            """;

        var existingCustomerDocuments = connection.Query<Guid>(sql, new { CustomerId = customerId.Value });

        return existingCustomerDocuments.Take(documentIds.Count + 1).Count() == documentIds.Count;
    }
}
