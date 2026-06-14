using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderStaff;

public sealed record UpdateProviderStaffCommand(
    Guid ServiceProviderId,
    Guid StaffId,
    LocalizedContentDto Notes,
    bool IsActive,
    Guid? NewStaffId = null
) : Command<bool>;
