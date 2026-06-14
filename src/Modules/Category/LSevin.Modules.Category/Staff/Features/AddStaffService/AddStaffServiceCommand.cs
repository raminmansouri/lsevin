using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.AddStaffService;

internal sealed record AddStaffServiceCommand(Guid StaffId, Guid ServiceDefinitionId, LocalizedContentDto Notes)
    : Command<Guid>;
