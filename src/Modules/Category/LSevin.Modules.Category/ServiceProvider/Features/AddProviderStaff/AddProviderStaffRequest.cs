using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderStaff;

public sealed record AddProviderStaffRequest(Guid StaffId, LocalizedContentDto Notes, bool IsActive = true);
