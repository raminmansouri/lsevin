using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Staff.Features.GetStaffAvailability;

internal sealed record GetStaffAvailabilityQuery(Guid StaffId)
    : Query<IReadOnlyCollection<GetStaffAvailabilityResponse>>;
