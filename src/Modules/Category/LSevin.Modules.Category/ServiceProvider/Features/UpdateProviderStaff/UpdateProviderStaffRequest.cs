using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderStaff;

public sealed record UpdateProviderStaffRequest(LocalizedContentDto Notes, bool IsActive, Guid? NewStaffId = null);
