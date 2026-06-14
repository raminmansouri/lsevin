using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public sealed class GetFeaturedServicesResponse
{
 
    public IReadOnlyCollection<ServiceProviderServiceDto> Services { get; set; } =
        new List<ServiceProviderServiceDto>();
}
