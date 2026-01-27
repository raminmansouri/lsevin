namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderServices;

public sealed record GetServiceProviderServicesRequest(Guid ServiceProviderId, bool? IsActive);
