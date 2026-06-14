namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Registry for managing composition roots in a modular application.
/// Based on the Composition Root pattern for dependency injection.
/// </summary>
/// <remarks>
/// <seealso href="https://freecontent.manning.com/dependency-injection-in-net-2nd-edition-understanding-the-composition-root/">Dependency Injection in .NET 2nd Edition - Understanding the Composition Root</seealso>
/// <seealso href="https://blog.ploeh.dk/2011/07/28/CompositionRoot/"> Pattern</seealso>
/// <seealso href="http://www.kamilgrzybek.com/design/modular-monolith-domain-centric-design/">Modular Monolith: Domain-Centric Design</seealso>
/// </remarks>
public static class CompositionRootRegistry
{
    private static readonly List<ICompositionRoot> _compositionRoots = new();

    /// <summary>
    /// Gets a read-only list of all registered composition roots.
    /// </summary>
    public static IReadOnlyList<ICompositionRoot> CompositionRoots => _compositionRoots.AsReadOnly();

    /// <summary>
    /// Gets the root service provider for the application.
    /// </summary>
    public static IServiceProvider RootServiceProvider { get; private set; } = null!;

    /// <summary>
    /// Sets the root service provider for the application.
    /// </summary>
    /// <param name="serviceProvider">The service provider to set as root.</param>
    public static void SetRootServiceProvider(IServiceProvider serviceProvider)
    {
        RootServiceProvider = serviceProvider;
    }

    /// <summary>
    /// Adds a composition root to the registry.
    /// </summary>
    /// <param name="compositionRoot">The composition root to add.</param>
    public static void Add(ICompositionRoot compositionRoot)
    {
        _compositionRoots.Add(compositionRoot);
    }

    /// <summary>
    /// Removes a composition root from the registry.
    /// </summary>
    /// <param name="compositionRoot">The composition root to remove.</param>
    public static void Remove(ICompositionRoot compositionRoot)
    {
        _compositionRoots.Add(compositionRoot);
    }

    /// <summary>
    /// Gets a composition root by its module's assembly name.
    /// </summary>
    /// <param name="assemblyName">The assembly name to search for.</param>
    /// <returns>The matching composition root, or null if not found.</returns>
    public static ICompositionRoot? GetByModuleByAssemblyName(string assemblyName)
    {
        return _compositionRoots.FirstOrDefault(x =>
            x.ModuleDefinition.GetType().Assembly.GetName().Name == assemblyName
        );
    }

    /// <summary>
    /// Gets a composition root by its module definition.
    /// </summary>
    /// <param name="moduleDefinition">The module definition to search for.</param>
    /// <returns>The matching composition root, or null if not found.</returns>
    public static ICompositionRoot? GetByModule(IModuleDefinition moduleDefinition)
    {
        return _compositionRoots.FirstOrDefault(x => x.ModuleDefinition == moduleDefinition);
    }

    /// <summary>
    /// Gets a composition root by its module type.
    /// </summary>
    /// <typeparam name="TModule">The type of module to search for.</typeparam>
    /// <returns>The matching composition root, or null if not found.</returns>
    public static ICompositionRoot? GetByModule<TModule>()
        where TModule : class, IModuleDefinition
    {
        return _compositionRoots.FirstOrDefault(x => x.ModuleDefinition.GetType() == typeof(TModule));
    }
}
