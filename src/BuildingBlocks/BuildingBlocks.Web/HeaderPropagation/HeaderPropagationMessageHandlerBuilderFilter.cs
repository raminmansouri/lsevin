using Microsoft.AspNetCore.HeaderPropagation;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Web.HeaderPropagation;

/// <summary>
/// Represents a filter for configuring header propagation in HTTP message handlers.
/// </summary>
public class HeaderPropagationMessageHandlerBuilderFilter(
    IOptions<HeaderPropagationMessageHandlerOptions> options,
    HeaderPropagationValues header
) : IHttpMessageHandlerBuilderFilter
{
    private readonly HeaderPropagationMessageHandlerOptions _options = options.Value;

    /// <inheritdoc/>
    public Action<HttpMessageHandlerBuilder> Configure(Action<HttpMessageHandlerBuilder> next)
    {
        return builder =>
        {
            builder.AdditionalHandlers.Add(new HeaderPropagationMessageHandler(_options, header));
            next(builder);
        };
    }
}
