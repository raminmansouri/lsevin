using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;


public sealed record GetNotificationCountResponse
{
    public int Count { get; set; }
}
