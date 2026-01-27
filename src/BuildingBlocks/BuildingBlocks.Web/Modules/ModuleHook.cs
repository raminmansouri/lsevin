using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Represents the module hook.
/// </summary>
public static class ModuleHook
{
    /// <summary>
    /// Action that is invoked when module services are configured.
    /// </summary>
    /// <remarks>
    /// This delegate takes an IServiceCollection and IModuleDefinition as parameters to allow
    /// customization of services during module configuration.
    /// </remarks>
    public static Action<IServiceCollection, IModuleDefinition>? ModuleServicesConfigured;
}
