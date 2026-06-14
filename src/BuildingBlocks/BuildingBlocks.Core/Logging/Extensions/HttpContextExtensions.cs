using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing;

namespace BuildingBlocks.Core.Logging.Extensions;

/// <summary>
/// Represents the HTTP context extensions.
/// </summary>
public static class HttpContextExtensions
{
    /// <summary>
    /// Gets the current resource name from the HTTP context.
    /// </summary>
    /// <param name="httpContext">The HTTP context.</param>
    /// <returns>The current resource name.</returns>
    public static string? GetMetricsCurrentResourceName(this HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var endpoint = httpContext.Features.Get<IEndpointFeature>()?.Endpoint;

        return endpoint?.Metadata.GetMetadata<EndpointNameMetadata>()?.EndpointName;
    }
}
