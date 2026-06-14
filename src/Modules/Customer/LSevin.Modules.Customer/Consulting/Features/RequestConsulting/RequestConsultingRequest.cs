namespace LSevin.Modules.Customer.Consulting.Features.RequestConsulting;

internal sealed record RequestConsultingRequest(
    string Description,
    Guid CategoryId,
    string CategoryName,
    IReadOnlyCollection<Guid> DocumentIds
);
