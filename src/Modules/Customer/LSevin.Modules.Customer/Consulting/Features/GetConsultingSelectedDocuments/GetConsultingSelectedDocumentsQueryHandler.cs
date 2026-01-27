using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultingSelectedDocuments;

internal sealed class GetConsultingSelectedDocumentsQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetConsultingSelectedDocumentsQuery, IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>> Handle(
        GetConsultingSelectedDocumentsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        const string sql = $"""
            SELECT
                cd.id AS {nameof(GetConsultingSelectedDocumentsResponse.CustomerDocumentId)},
                cd.document_url AS {nameof(GetConsultingSelectedDocumentsResponse.DocumentUrl)},
                cdt.name AS {nameof(GetConsultingSelectedDocumentsResponse.DocumentType)}
            FROM customer.consultings c
            JOIN customer.consulting_selected_document_references csr ON c.id = csr.consulting_id
            JOIN customer.customer_documents cd ON csr.customer_document_id = cd.id
            JOIN customer.customer_document_types cdt ON cd.document_type_id = cdt.id
            WHERE c.id = @ConsultingId
            """;

        var documents = await connection.QueryAsync<GetConsultingSelectedDocumentsResponse>(
            new CommandDefinition(sql, new { request.ConsultingId }, cancellationToken: cancellationToken)
        );

        return documents.AsList();
    }
}
