using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderStaff;

public sealed record AddProviderStaffCommand(
    Guid ServiceProviderId,
    Guid StaffId,
    LocalizedContentDto Notes,
    bool IsActive = true
) : Command<Guid>;
