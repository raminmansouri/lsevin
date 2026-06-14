using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderPolicy;

internal sealed record UpdateProviderPolicyRequest(LocalizedContentDto Type, LocalizedContentDto Description);
