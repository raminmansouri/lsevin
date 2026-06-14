using BuildingBlocks.Web.Modules;

namespace BuildingBlocks.Web.Endpoints;

/// <summary>
/// Represents a class that provides essential services and dependencies for endpoints in a web application. This class is used for endpoints that are not part of a module.
/// </summary>
/// <param name="gateway">The gateway processor.</param>
/// <param name="cancellationToken">The cancellation token for handling asynchronous operations.</param>
/// <typeparam name="TModule">The type of the module.</typeparam>
public sealed class BaseEndpointServices<TModule>(
    IGatewayProcessor<TModule> gateway,
    CancellationToken cancellationToken = default
)
    where TModule : class, IModuleDefinition
{
    /// <summary>
    /// Gets the Mediator query bus instance for handling commands and queries.
    /// </summary>
    public IGatewayProcessor<TModule> Gateway { get; } = gateway;

    /// <summary>
    /// Gets the cancellation token for handling asynchronous operations.
    /// </summary>
    public CancellationToken CancellationToken { get; } = cancellationToken;
}
