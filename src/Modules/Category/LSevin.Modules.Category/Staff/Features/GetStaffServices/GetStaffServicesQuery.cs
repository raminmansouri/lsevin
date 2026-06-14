using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Staff.Features.GetStaffServices;

internal sealed record GetStaffServicesQuery(Guid StaffId) : Query<IReadOnlyCollection<GetStaffServicesResponse>>;
