using Microsoft.AspNetCore.Mvc;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

public sealed record GetTrustedProvidersRequest(bool? IsActive, Guid[]? ProviderTypeIds);
