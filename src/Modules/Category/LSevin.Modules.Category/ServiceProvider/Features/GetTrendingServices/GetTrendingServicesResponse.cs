using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public sealed class GetTrendingServicesResponse
{
 
    public IReadOnlyCollection<TrendingServiceDto> Services { get; set; } =
        new List<TrendingServiceDto>();
    public string Title { get; internal set; }
}
