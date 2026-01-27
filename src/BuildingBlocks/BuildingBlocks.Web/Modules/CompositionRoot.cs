using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Represents the composition root for dependency injection and module configuration.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="CompositionRoot"/> class.
/// </remarks>
/// <param name="serviceProvider">The service provider for dependency injection.</param>
/// <param name="module">The module definition containing configuration.</param>
public class CompositionRoot(IServiceProvider serviceProvider, IModuleDefinition module) : ICompositionRoot
{
    /// <summary>
    /// Gets the service provider for dependency injection.
    /// </summary>
    public IServiceProvider ServiceProvider { get; } = serviceProvider;

    /// <summary>
    /// Gets the module definition containing configuration.
    /// </summary>
    public IModuleDefinition ModuleDefinition { get; } = module;

    /// <summary>
    /// Creates a new service scope from the service provider.
    /// </summary>
    /// <returns>A new <see cref="IServiceScope"/> instance.</returns>
    public IServiceScope CreateScope()
    {
        return ServiceProvider.CreateScope();
    }
}
