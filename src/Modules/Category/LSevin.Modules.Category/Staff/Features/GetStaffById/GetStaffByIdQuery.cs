using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Staff.Features.GetStaffById;

internal sealed record GetStaffByIdQuery(Guid StaffId) : Query<GetStaffByIdResponse>;
