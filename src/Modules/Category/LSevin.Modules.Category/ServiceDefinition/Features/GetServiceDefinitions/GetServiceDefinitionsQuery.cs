using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

internal sealed record GetServiceDefinitionsQuery(Guid? CategoryId, bool? IsActive)
    : PageQuery<IPageList<GetServiceDefinitionsResponse>>
{
    public static GetServiceDefinitionsQuery Of(GetServiceDefinitionsRequest request, PageRequest pageRequest)
    {
        var (categoryId, isActive) = request;
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;
        return new GetServiceDefinitionsQuery(categoryId, isActive)
        {
            CategoryId = categoryId,
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
