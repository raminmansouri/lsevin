using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffService;

internal sealed record UpdateStaffServiceRequest(
    bool IsActive,
    LocalizedContentDto Notes,
    Guid? ServiceDefinitionId = null
);
