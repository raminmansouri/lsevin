using LSevin.Tests.Shared.Helpers;
using Xunit.Sdk;

namespace LSevin.Tests.Shared.XunitCategories;

/// <summary>
/// Could filter by 'dotnet test --filter "Category=TestCategory"' in running tests in command line.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="CategoryTraitAttribute"/> class.
/// </remarks>
/// <param name="name">The category name.</param>
[TraitDiscoverer(CategoryTraitDiscoverer.DiscovererTypeName, TestConstants.AssemblyTestFrameworkAssemblyName)]
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public sealed class CategoryTraitAttribute(TestCategory name) : Attribute, ITraitAttribute
{
    /// <summary>
    /// Gets the category.
    /// </summary>
    public TestCategory Name { get; } = name;
}

/// <summary>
/// Represents the category trait discoverer.
/// </summary>
public sealed class CategoryTraitDiscoverer : ITraitDiscoverer
{
    private const string Key = "Category";

    public const string DiscovererTypeName =
        $"{TestConstants.AssemblyTestFrameworkAssemblyName}.{nameof(XunitCategories)}.{nameof(CategoryTraitDiscoverer)}";

    /// <inheritdoc />
    public IEnumerable<KeyValuePair<string, string>> GetTraits(IAttributeInfo traitAttribute)
    {
        var categoryName = traitAttribute.GetNamedArgument<TestCategory?>("Name");

        if (categoryName is not null)
        {
            yield return new KeyValuePair<string, string>(Key, categoryName.ToString()!);
        }
    }
}

/// <summary>
/// Represents the test category.
/// </summary>
public enum TestCategory
{
    Architecture,
    Unit,
    Integration,
    EndToEnd,
    Acceptance,
}
