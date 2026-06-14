using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

internal sealed record GetServiceProvidersQuery(bool? IsActive, Guid[]? ProviderTypeIds)
    : PageQuery<IPageList<GetServiceProvidersResponse>>
{
    public static GetServiceProvidersQuery Of(GetServiceProvidersRequest request, PageRequest pageRequest)
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetServiceProvidersQuery(request.IsActive, request.ProviderTypeIds)
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
