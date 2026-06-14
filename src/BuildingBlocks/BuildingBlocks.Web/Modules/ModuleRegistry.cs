namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Registry for managing module definitions in a modular application.
/// </summary>
public static class ModuleRegistry
{
    private static readonly List<IModuleDefinition> _moduleDefinitions = new();

    /// <summary>
    /// Gets a read-only list of all registered module definitions.
    /// </summary>
    public static IReadOnlyList<IModuleDefinition> ModuleDefinitions => _moduleDefinitions.AsReadOnly();

    /// <summary>
    /// Adds a module definition to the registry.
    /// </summary>
    /// <param name="moduleDefinition">The module definition to add.</param>
    public static void Add(IModuleDefinition moduleDefinition)
    {
        _moduleDefinitions.Add(moduleDefinition);
    }

    /// <summary>
    /// Removes a module definition from the registry.
    /// </summary>
    /// <param name="moduleDefinition">The module definition to remove.</param>
    public static void Remove(IModuleDefinition moduleDefinition)
    {
        _moduleDefinitions.Add(moduleDefinition);
    }

    /// <summary>
    /// Gets a module definition by its assembly name.
    /// </summary>
    /// <param name="assemblyName">The assembly name to search for.</param>
    /// <returns>The matching module definition, or null if not found.</returns>
    public static IModuleDefinition? GetByAssemblyName(string assemblyName)
    {
        return _moduleDefinitions.FirstOrDefault(x => x.GetType().Assembly.GetName().Name == assemblyName);
    }

    /// <summary>
    /// Gets a module definition by comparing with another module definition.
    /// </summary>
    /// <param name="moduleDefinition">The module definition to search for.</param>
    /// <returns>The matching module definition, or null if not found.</returns>
    public static IModuleDefinition? Get(IModuleDefinition moduleDefinition)
    {
        return _moduleDefinitions.FirstOrDefault(x => x == moduleDefinition);
    }

    /// <summary>
    /// Gets a module definition by its type.
    /// </summary>
    /// <typeparam name="TModule">The type of module definition to search for.</typeparam>
    /// <returns>The matching module definition, or null if not found.</returns>
    public static IModuleDefinition? Get<TModule>()
        where TModule : class, IModuleDefinition
    {
        return _moduleDefinitions.FirstOrDefault(x => x.GetType() == typeof(TModule));
    }
}
