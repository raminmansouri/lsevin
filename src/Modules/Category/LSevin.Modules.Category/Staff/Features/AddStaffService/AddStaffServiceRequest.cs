using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Staff.Features.AddStaffService;

public sealed record AddStaffServiceRequest(Guid ServiceDefinitionId, LocalizedContentDto Notes);
