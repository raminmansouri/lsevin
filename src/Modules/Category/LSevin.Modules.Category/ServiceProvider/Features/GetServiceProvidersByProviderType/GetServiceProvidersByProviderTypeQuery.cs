using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

internal sealed record GetServiceProvidersByProviderTypeQuery(
    Guid ProviderTypeId,
    string? CountryCode,
    string? CityCode,
    string[]? AttributeFilters
) : PageQuery<IPageList<GetServiceProvidersByProviderTypeResponse>>
{
    public static GetServiceProvidersByProviderTypeQuery Of(
        GetServiceProvidersByProviderTypeRequest request,
        PageRequest pageRequest
    )
    {
        var (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = pageRequest;

        return new GetServiceProvidersByProviderTypeQuery(
            request.ProviderTypeId,
            request.CountryCode,
            request.CityCode,
            request.AttributeFilters
        )
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
