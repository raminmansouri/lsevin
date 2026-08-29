using System.Reflection;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules.Extensions;

/// <summary>
/// Extension methods for configuring and managing modules in the application.
/// </summary>
// https://freecontent.manning.com/dependency-injection-in-net-2nd-edition-understanding-the-composition-root/
// https://blog.ploeh.dk/2011/07/28/CompositionRoot/
public static class ModuleExtensions
{
    /// <summary>
    /// Adds services for a specific module to the web application builder.
    /// </summary>
    /// <typeparam name="TModule">The type of the module to configure.</typeparam>
    /// <param name="webApplicationBuilder">The web application builder.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="useNewComposition">Flag to determine if a new composition root should be used.</param>
    public static void AddModuleServices<TModule>(
        this WebApplicationBuilder webApplicationBuilder,
        IWebHostEnvironment webHostEnvironment,
        bool useNewComposition = false
    )
        where TModule : class, IModuleDefinition
    {
        AddModuleServices<TModule>(
            webApplicationBuilder.Services,
            webApplicationBuilder.Configuration,
            webHostEnvironment,
            useNewComposition
        );
    }

    /// <summary>
    /// Adds services for all modules found in the specified assemblies.
    /// </summary>
    /// <param name="webApplicationBuilder">The web application builder.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="useCompositionRootForModules">Flag to determine if composition root should be used for modules.</param>
    /// <param name="scanAssemblies">Optional assemblies to scan for modules.</param>
    public static void AddModulesServices(
        this WebApplicationBuilder webApplicationBuilder,
        IWebHostEnvironment webHostEnvironment,
        bool useCompositionRootForModules = false,
        params Assembly[] scanAssemblies
    )
    {
        AddModulesServices(
            webApplicationBuilder.Services,
            webApplicationBuilder.Configuration,
            webHostEnvironment,
            useCompositionRootForModules,
            scanAssemblies
        );
    }

    /// <summary>
    /// Adds services for all modules found in the specified assemblies.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="useCompositionRootForModules">Flag to determine if composition root should be used for modules.</param>
    /// <param name="scanAssemblies">Optional assemblies to scan for modules.</param>
    public static void AddModulesServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment webHostEnvironment,
        bool useCompositionRootForModules = false,
        params Assembly[] scanAssemblies
    )
    {
        var assemblies = scanAssemblies.Length != 0 ? scanAssemblies : AppDomain.CurrentDomain.GetAssemblies();

        var modules = ReflectionUtilities.GetAllTypesImplementingInterface<IModuleDefinition>(assemblies);

        foreach (var module in modules)
        {
            AddModuleServices(services, configuration, webHostEnvironment, module, useCompositionRootForModules);
        }

        // For handling specific composition root for processing commands and queries based on module
        services.AddGatewayProcessor();
    }

    /// <summary>
    /// Adds services for a specific module type.
    /// </summary>
    /// <typeparam name="TModule">The type of the module to configure.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="useCompositionRootForModules">Flag to determine if composition root should be used.</param>
    public static void AddModuleServices<TModule>(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment webHostEnvironment,
        bool useCompositionRootForModules = false
    )
        where TModule : class, IModuleDefinition
    {
        AddModuleServices(services, configuration, webHostEnvironment, typeof(TModule), useCompositionRootForModules);

        // For handling specific composition root for processing commands and queries based on module
        services.AddGatewayProcessor();
    }

    /// <summary>
    /// Adds services for a module of the specified type.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="moduleType">The type of the module to configure.</param>
    /// <param name="useCompositionRootForModules">Flag to determine if composition root should be used.</param>
    public static void AddModuleServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment webHostEnvironment,
        Type moduleType,
        bool useCompositionRootForModules = false
    )
    {
        AddModulesDependency(services, configuration, webHostEnvironment, moduleType, useCompositionRootForModules);
    }

    /// <summary>
    /// Adds services for a specific module instance to the web application builder.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="webHostEnvironment">The web host environment.</param>
    /// <param name="module">The module instance.</param>
    /// <param name="useCompositionRootForModules">Flag to determine if composition root should be used.</param>
    private static void AddModulesDependency(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment webHostEnvironment,
        Type module,
        bool useCompositionRootForModules
    )
    {
        var newServiceCollection = useCompositionRootForModules ? services.CreatNewServiceCollection() : services;

        var instantiatedType = (IModuleDefinition)Activator.CreateInstance(module)!;
        instantiatedType.AddModuleServices(newServiceCollection, configuration, webHostEnvironment);

        ModuleHook.ModuleServicesConfigured?.Invoke(newServiceCollection, instantiatedType);

        ModuleRegistry.Add(instantiatedType);

        if (useCompositionRootForModules)
        {
            CompositionRootRegistry.Add(
                new CompositionRoot(newServiceCollection.BuildServiceProvider(), instantiatedType)
            );
        }
    }

    /// <summary>
    /// Configures all registered modules in the application.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public static async Task ConfigureModules(this WebApplication app)
    {
        var modules = ModuleRegistry.ModuleDefinitions;

        foreach (var module in modules)
        {
            await ConfigureModule(app, module);
        }
    }

    /// <summary>
    /// Configures a specific module in the application.
    /// </summary>
    /// <typeparam name="TModule">The type of the module to configure.</typeparam>
    /// <param name="app">The web application.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public static async Task ConfigureModule<TModule>(this WebApplication app)
        where TModule : class, IModuleDefinition
    {
        var module = ModuleRegistry.Get<TModule>();
        if (module is null)
        {
            return;
        }

        await ConfigureModule(app, module);
    }

    /// <summary>
    /// Configures a specific module instance in the application.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <param name="module">The module instance to configure.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public static async Task ConfigureModule(this WebApplication app, IModuleDefinition module)
    {
        CompositionRootRegistry.SetRootServiceProvider(app.Services);

        var compositionRoot = CompositionRootRegistry.GetByModule(module);
        if (compositionRoot is { })
        {
            // For composition roots we have to execute them manually because hosted services only runs for root service provider
            await module.ConfigureModule(
                new ApplicationBuilder(compositionRoot.ServiceProvider),
                app.Configuration,
                app.Logger,
                app.Environment
            );
        }
        else
        {
            CompositionRootRegistry.Add(new CompositionRoot(app.Services, module));
            await module.ConfigureModule(app, app.Configuration, app.Logger, app.Environment);
        }
    }

    /// <summary>
    /// Maps endpoints for all registered modules.
    /// </summary>
    /// <param name="builder">The endpoint route builder.</param>
    public static void MapModulesEndpoints(this IEndpointRouteBuilder builder)
    {
        var modules = ModuleRegistry.ModuleDefinitions;

        foreach (var module in modules)
        {
            MapModuleEndpoints(builder, module);
        }
    }

    /// <summary>
    /// Maps endpoints for a specific module type.
    /// </summary>
    /// <typeparam name="TModule">The type of the module.</typeparam>
    /// <param name="builder">The endpoint route builder.</param>
    public static void MapModuleEndpoints<TModule>(this IEndpointRouteBuilder builder)
        where TModule : class, IModuleDefinition
    {
        var module = ModuleRegistry.Get<TModule>();
        if (module is null)
        {
            return;
        }

        MapModuleEndpoints(builder, module);
    }

    /// <summary>
    /// Maps endpoints for a specific module instance.
    /// </summary>
    /// <param name="builder">The endpoint route builder.</param>
    /// <param name="module">The module instance.</param>
    public static void MapModuleEndpoints(this IEndpointRouteBuilder builder, IModuleDefinition module)
    {
        var compositionRoot = CompositionRootRegistry.GetByModule(module);
        module.MapEndpoints(builder);
    }

    /// <summary>
    /// Gets the composition root for the specified assembly.
    /// </summary>
    /// <param name="assembly">The assembly to get the composition root for.</param>
    /// <returns>The composition root if found; otherwise, null.</returns>
    public static ICompositionRoot? GetCurrentCompositionRoot(this Assembly assembly)
    {
        var name = Guard.Against.Null(assembly.GetName().Name, nameof(assembly));
        return CompositionRootRegistry.GetByModuleByAssemblyName(name);
    }

    /// <summary>
    /// Gets the composition root for the assembly containing the specified object's type.
    /// </summary>
    /// <param name="instance">The object instance.</param>
    /// <returns>The composition root if found; otherwise, null.</returns>
    public static ICompositionRoot? GetCurrentCompositionRoot(this object instance)
    {
        var name = Guard.Against.Null(instance.GetType().Assembly.GetName().Name, nameof(instance));
        return CompositionRootRegistry.GetByModuleByAssemblyName(name);
    }

    /// <summary>
    /// Adds module-specific settings files to the configuration.
    /// </summary>
    /// <param name="configurationManager">The configuration manager.</param>
    /// <param name="root">The root directory path.</param>
    public static void AddModulesSettingsFile(
        this ConfigurationManager configurationManager,
        string root
    )
    {
        // Module settings files (<module>.appsettings.json) are copied to the application
        // root next to the module assemblies — they are never in a subdirectory. Scan only
        // the top level: recursing walked the entire content root, including the bind-mounted
        // upload directory (tens of thousands of user files, host-controlled permissions),
        // where a single unreadable subdirectory aborted startup with UnauthorizedAccessException.
        foreach (var file in Directory.GetFiles(root, "*.appsettings.json", SearchOption.TopDirectoryOnly))
        {
            configurationManager.AddJsonFile(file);
        }
    }
}
