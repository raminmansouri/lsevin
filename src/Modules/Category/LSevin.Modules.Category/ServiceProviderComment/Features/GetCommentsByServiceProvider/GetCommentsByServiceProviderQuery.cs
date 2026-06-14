using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.GetCommentsByServiceProvider;

internal sealed record GetCommentsByServiceProviderQuery(Guid ServiceProviderId)
    : PageQuery<IPageList<GetCommentsByServiceProviderResponse>>
{
    public static GetCommentsByServiceProviderQuery Of(Guid serviceProviderId, PageRequest pageRequest)
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;
        return new GetCommentsByServiceProviderQuery(serviceProviderId)
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
