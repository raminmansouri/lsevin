using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

internal sealed record GetTrustedProvidersQuery(bool? IsActive, Guid[]? ProviderTypeIds)
    : PageQuery<IPageList<GetTrustedProvidersResponse>>
{
    public static GetTrustedProvidersQuery Of(GetTrustedProvidersRequest request, PageRequest pageRequest)
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetTrustedProvidersQuery(request.IsActive, request.ProviderTypeIds)
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
