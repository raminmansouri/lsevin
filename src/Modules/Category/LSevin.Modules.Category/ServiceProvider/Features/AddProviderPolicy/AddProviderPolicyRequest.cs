using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderPolicy;

public sealed record AddProviderPolicyRequest(LocalizedContentDto Type, LocalizedContentDto Description);
