using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypes;

internal sealed record GetProviderTypesQuery(bool? IsActive) : PageQuery<IPageList<GetProviderTypesResponse>>
{
    public static GetProviderTypesQuery Of(GetProviderTypesRequest request, PageRequest pageRequest)
    {
        bool? isActive = request.IsActive;
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;
        return new GetProviderTypesQuery(isActive)
        {
            IsActive = isActive,
            PageNumber = pageNumber,
            PageSize = pageSize,
            Filters = filters,
            SortOrder = sortOrder,
            StartDate = startDate,
            EndDate = endDate,
        };
    }
}
