using System.Reflection;
using LSevin.Modules.Customer;
using LSevin.Modules.Identity;

namespace LSevin.ArchitectureTests;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class BaseTest
{
    protected static readonly Assembly IdentityAssembly = typeof(IdentityReference).Assembly;
    protected const string IdentityNameSpace = "LSevin.Modules.Identity";

    protected static readonly Assembly CustomerAssembly = typeof(CustomerReference).Assembly;
    protected const string CustomerNameSpace = "LSevin.Modules.Customer";
}
