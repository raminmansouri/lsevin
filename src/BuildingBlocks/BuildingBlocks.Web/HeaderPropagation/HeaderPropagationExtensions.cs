using BuildingBlocks.Core.Web.Constants;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Http;

namespace BuildingBlocks.Web.HeaderPropagation;

/// <summary>
/// Extension methods for configuring header propagation.
/// </summary>
public static class HeaderPropagationExtensions
{
    /// <summary>
    /// Registers the header propagation services.
    /// </summary>
    /// <param name="services">The service collection to register the services with.</param>
    /// <returns>The updated service collection with header propagation services added.</returns>
    public static IServiceCollection AddPropagation(this IServiceCollection services)
    {
        services.AddHeaderPropagation(options =>
        {
            options.Headers.Add(RequestHeaderConstValues.CorrelationId);
            options.Headers.Add(RequestHeaderConstValues.CausationId);
        });

        services.TryAddEnumerable(
            ServiceDescriptor.Singleton<
                IHttpMessageHandlerBuilderFilter,
                HeaderPropagationMessageHandlerBuilderFilter
            >()
        );
        return services;
    }
}
