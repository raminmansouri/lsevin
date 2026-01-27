namespace LSevin.Modules.Category.ServiceRequest.Features.GetMyServiceProviderRequests;

public sealed record GetMyServiceProviderRequestsResponse(
    Guid Id,
    Guid ServiceProviderId,
    Guid CustomerId,
    string CustomerEmail,
    string CustomerFullName,
    string Message,
    string Status,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
