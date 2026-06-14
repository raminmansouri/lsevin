using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderStaff;

public sealed record RemoveProviderStaffCommand(Guid ServiceProviderId, Guid StaffId) : Command<bool>;
