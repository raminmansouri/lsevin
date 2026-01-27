using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultingSelectedDocuments;

internal sealed record GetConsultingSelectedDocumentsQuery(Guid ConsultingId)
    : Query<IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>;
