namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsAdmin;

public sealed record GetServiceProviderRequestsAdminResponse(
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
