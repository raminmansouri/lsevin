using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Staff.Features.GetStaffDetails;

internal sealed record GetStaffDetailsQuery(Guid StaffId) : Query<GetStaffDetailsResponse>;
