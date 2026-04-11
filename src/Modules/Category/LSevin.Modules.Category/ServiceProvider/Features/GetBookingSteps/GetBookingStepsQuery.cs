using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

internal sealed record GetBookingStepsQuery(bool? IsActive, Guid[]? ProviderTypeIds)
    : PageQuery<IPageList<GetBookingStepsResponse>>
{
    public static GetBookingStepsQuery Of(GetBookingStepsRequest request, PageRequest pageRequest)
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetBookingStepsQuery(request.IsActive, request.ProviderTypeIds)
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
