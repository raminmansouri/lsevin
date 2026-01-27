using LSevin.Modules.Common.HttpClients;
using Microsoft.Extensions.DependencyInjection;

namespace LSevin.Modules.Category.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    public static IServiceCollection AddHttpClients(this IServiceCollection services)
    {
        return services.AddWebApplicationCacheApiClient();
    }
}
