namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsPagedAdmin;

public sealed record GetServiceProviderRequestsPagedAdminResponse(
    Guid Id,
    Guid ServiceProviderId,
    string ServiceProviderName,
    Guid CustomerId,
    string CustomerFullName,
    string CustomerEmail,
    string Message,
    string Status,
    DateTime CreateDate
);
