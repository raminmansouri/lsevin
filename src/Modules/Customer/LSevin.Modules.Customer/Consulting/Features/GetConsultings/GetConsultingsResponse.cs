namespace LSevin.Modules.Customer.Consulting.Features.GetConsultings;

internal sealed record GetConsultingsResponse(
    Guid ConsultingId,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string Description,
    Guid CategoryId,
    string CategoryName
);
