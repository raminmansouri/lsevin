using System.Reflection;

namespace BuildingBlocks.Core.Web.Module;

/// <summary>
/// Represents a module information.
/// </summary>
public interface IModuleInformation
{
    /// <summary>
    /// Gets the module name.
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets the module schema.
    /// </summary>
    string Schema { get; }

    /// <summary>
    /// Gets the module assembly.
    /// </summary>
    Assembly Assembly { get; }
}
