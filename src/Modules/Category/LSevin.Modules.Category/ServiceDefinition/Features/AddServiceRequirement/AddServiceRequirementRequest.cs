using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceRequirement;

internal sealed record AddServiceRequirementRequest(LocalizedContentDto Description, bool IsMandatory);
