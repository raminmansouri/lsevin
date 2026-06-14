using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddServiceProviderAttribute;

public sealed record AddProviderAttributeRequest(Guid AttributeDefinitionId, LocalizedContentDto Value);
