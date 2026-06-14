using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.Staff.Features.GetStaff;

internal sealed record GetStaffQuery(bool? IsActive) : PageQuery<IPageList<GetStaffResponse>>
{
    public static GetStaffQuery Of(GetStaffRequest request, PageRequest pageRequest)
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetStaffQuery(request.IsActive)
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            Filters = filters,
            SortOrder = sortOrder,
            StartDate = startDate,
            EndDate = endDate,
        };
    }
}
