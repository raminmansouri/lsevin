namespace LSevin.Modules.Customer.Consulting.Features.GetConsultingSelectedDocuments;

internal sealed record GetConsultingSelectedDocumentsResponse(
    Guid CustomerDocumentId,
    string DocumentUrl,
    string DocumentType
);
