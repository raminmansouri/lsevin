using LSevin.Tests.Shared.Extensions;
using LSevin.Tests.Shared.XunitCategories;
using NetArchTest.Rules;

namespace LSevin.ArchitectureTests;

/// <summary>
/// Represents the layer tests.
/// </summary>
public class Tests : BaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void IdentityModule_ShouldNotHaveDependencyOn_AnyOtherModule()
    {
        string[] otherModules = [CustomerNameSpace];

        Types
            .InAssembly(IdentityAssembly)
            .Should()
            .NotHaveDependencyOnAny(otherModules)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void CustomerModule_ShouldNotHaveDependencyOn_AnyOtherModule()
    {
        string[] otherModules = [IdentityNameSpace];

        Types
            .InAssembly(CustomerAssembly)
            .Should()
            .NotHaveDependencyOnAny(otherModules)
            .GetResult()
            .ShouldBeSuccessful();
    }
}
