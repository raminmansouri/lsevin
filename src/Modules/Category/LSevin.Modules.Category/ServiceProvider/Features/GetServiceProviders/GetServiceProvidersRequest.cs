using Microsoft.AspNetCore.Mvc;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

public sealed record GetServiceProvidersRequest(bool? IsActive, Guid[]? ProviderTypeIds);
