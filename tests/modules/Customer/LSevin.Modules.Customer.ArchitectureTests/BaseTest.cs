using System.Reflection;

namespace LSevin.Modules.Customer.ArchitectureTests;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class BaseTest
{
    /// <summary>
    /// Gets the domain assembly.
    /// </summary>
    protected static readonly Assembly CustomerAssembly = typeof(CustomerReference).Assembly;
}
