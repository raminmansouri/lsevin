using LSevin.Modules.Common.HttpClients;
using Microsoft.Extensions.DependencyInjection;

namespace LSevin.Modules.Customer.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    public static IServiceCollection AddHttpClients(this IServiceCollection services)
    {
        return services.AddWebApplicationCacheApiClient();
    }
}
