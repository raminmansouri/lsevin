using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceRequirement;

internal sealed record UpdateServiceRequirementRequest(LocalizedContentDto Description, bool IsMandatory);
