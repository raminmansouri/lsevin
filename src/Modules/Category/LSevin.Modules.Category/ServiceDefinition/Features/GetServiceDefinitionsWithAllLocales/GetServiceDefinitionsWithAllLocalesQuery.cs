using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionsWithAllLocales;

internal sealed record GetServiceDefinitionsWithAllLocalesQuery(Guid? CategoryId, bool? IsActive)
    : PageQuery<IPageList<GetServiceDefinitionsWithAllLocalesResponse>>
{
    public static GetServiceDefinitionsWithAllLocalesQuery Of(
        GetServiceDefinitionsWithAllLocalesRequest request,
        PageRequest pageRequest
    )
    {
        var (categoryId, isActive) = request;
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetServiceDefinitionsWithAllLocalesQuery(categoryId, isActive)
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
