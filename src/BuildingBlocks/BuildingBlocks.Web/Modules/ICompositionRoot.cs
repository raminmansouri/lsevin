using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Represents the composition root interface for dependency injection and module configuration.
/// </summary>
public interface ICompositionRoot
{
    /// <summary>
    /// Gets the service provider for dependency injection.
    /// </summary>
    IServiceProvider ServiceProvider { get; }

    /// <summary>
    /// Gets the module definition containing configuration.
    /// </summary>
    IModuleDefinition ModuleDefinition { get; }

    /// <summary>
    /// Creates a new service scope from the service provider.
    /// </summary>
    /// <returns>A new <see cref="IServiceScope"/> instance.</returns>
    IServiceScope CreateScope();
}
