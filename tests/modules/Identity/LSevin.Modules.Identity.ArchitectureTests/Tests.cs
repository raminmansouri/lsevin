using BuildingBlocks.Core.ResultPattern;
using LSevin.Tests.Shared.Extensions;
using LSevin.Tests.Shared.Helpers;
using LSevin.Tests.Shared.XunitCategories;
using MediatR;
using NetArchTest.Rules;

namespace LSevin.Modules.Identity.ArchitectureTests;

/// <summary>
/// Represents the tests.
/// </summary>
public class Tests : BaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEvents_Should_BeImmutable()
    {
        Types.InAssembly(IdentityAssembly).That().PredictDomainEvents().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEvents_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainEvents()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEvents_Should_HaveCorrectPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainEvents()
            .Should()
            .HaveNameEndingWith("DomainEvent", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Entities_Should_HavePrivateParameterlessConstructor()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictEntities()
            .GetTypes()
            .AssertHavePrivateParameterlessConstructor();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Entities_Should_OnlyHavePrivateSetters()
    {
        Types.InAssembly(IdentityAssembly).That().PredictEntities().GetTypes().AssertOnlyHavePrivateOrInitSetters();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void EntitiesFromAnAggregate_Should_NotReferenceOtherAggregateRoot()
    {
        var allEntities = Types.InAssembly(IdentityAssembly).That().PredictEntities().GetTypes().ToList();
        var aggregateRootTypes = Types.InAssembly(IdentityAssembly).That().PredictAggregateRoots().GetTypes().ToList();
        var nonAggregateEntities = allEntities.Where(x => !aggregateRootTypes.Contains(x)).ToList();

        nonAggregateEntities.AssertDoNotReferenceOtherTypes(aggregateRootTypes);
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_BeImmutable()
    {
        Types.InAssembly(IdentityAssembly).That().PredictValueObjects().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_HavePrivateConstructorsOnly()
    {
        Types.InAssembly(IdentityAssembly).That().PredictValueObjects().GetTypes().AssertHavePrivateConstructorsOnly();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_HaveConstructorWithJsonConstructorAttribute()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictValueObjects()
            .GetTypes()
            .AssertHaveConstructorWithJsonConstructorAttribute();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void TypedIds_Should_BeImmutable()
    {
        Types.InAssembly(IdentityAssembly).That().PredictTypedIds().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void TypedIds_Should_HaveIdPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .AreSealed()
            .And()
            .PredictTypedIds()
            .Should()
            .HaveNameEndingWith("Id", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Repositories_Should_OnlyExistForAggregateRoots()
    {
        var aggregateRoots = Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictAggregateRoots()
            .GetTypes()
            .Select(t => $"I{t.Name.Replace("Aggregate", string.Empty, StringComparison.Ordinal)}")
            .ToList();

        var repositories = Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictRepositories()
            .And()
            .AreInterfaces()
            .GetTypes();

        repositories.AssertOnlyExistForSpecificTypesByName(aggregateRoots, name: "Repository");
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainServices_Should_HaveServicePostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainServices()
            .And()
            .AreClasses()
            .Should()
            .HaveNameEndingWith("Service", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Specifications_Should_HaveSpecificationPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictSpecifications()
            .Should()
            .HaveNameEndingWith("Spec", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void BusinessRules_Should_HaveRulePostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictBusinessRules()
            .Should()
            .HaveNameEndingWith("Rule", StringComparison.Ordinal)
            .Or()
            .HaveNameMatching(@".*Rule`\d+")
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainObjects_Should_OnlyHavePrivateConstructors()
    {
        Types.InAssembly(IdentityAssembly).That().PredictDomainObjects().GetTypes().AssertHavePrivateConstructorsOnly();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainObjects_Should_HaveStaticCreateMethod()
    {
        Types.InAssembly(IdentityAssembly).That().PredictDomainObjects().GetTypes().AssertHaveStaticCreateMethod();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Commands_Should_BeImmutable()
    {
        Types.InAssembly(IdentityAssembly).That().PredictCommands().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Commands_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommands()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Commands_Should_HaveCommandPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommands()
            .Should()
            .HaveNameEndingWith("Command", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void CommandHandlers_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommandHandlers()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void CommandHandlers_Should_HavCommandHandlerPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommandHandlers()
            .Should()
            .HaveNameEndingWith("CommandHandler", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void CommandHandlers_Should_ReturnResultType()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommandHandlers()
            .Should()
            .MeetCustomRule(new ReturnTypeRule(typeof(Result<>)))
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Queries_Should_BeImmutable()
    {
        Types.InAssembly(IdentityAssembly).That().PredictQueries().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Queries_Should_BeSealed()
    {
        Types.InAssembly(IdentityAssembly).That().PredictQueries().Should().BeSealed().GetResult().ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Queries_Should_HaveQueryPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictQueries()
            .Should()
            .HaveNameEndingWith("Query", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void QueryHandlers_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictQueryHandlers()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void QueryHandlers_Should_ReturnResultType()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictQueryHandlers()
            .Should()
            .MeetCustomRule(new ReturnTypeRule(typeof(Result<>)))
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void QueryHandlers_Should_HaveQueryHandlerPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictQueryHandlers()
            .Should()
            .HaveNameEndingWith("QueryHandler", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void CommandAndQueryHandlers_Should_NotBePublic()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictCommandHandlers()
            .Or()
            .PredictQueryHandlers()
            .Should()
            .NotBePublic()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Validators_Should_NotBePublic()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictValidators()
            .Should()
            .NotBePublic()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Validators_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictValidators()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Validators_Should_HaveValidatorPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictValidators()
            .Should()
            .HaveNameEndingWith("Validator", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEventHandlers_Should_NotBePublic()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainEventHandlers()
            .Should()
            .NotBePublic()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEventHandlers_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainEventHandlers()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEventHandlers_Should_HaveDomainEventHandlerPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictDomainEventHandlers()
            .Should()
            .HaveNameEndingWith("DomainEventHandler", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void MediatorRequestHandlers_Should_NotBeUsedDirectly()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .DoNotHaveName("ICommandHandler`1")
            .Or()
            .DoNotHaveName("IQueryHandler`1")
            .Should()
            .ImplementInterface(typeof(IRequestHandler<,>))
            .GetTypes()
            .AssertOnlyHaveRequestHandlers(typeof(IRequestHandler<,>));
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void MediatorNotificationHandlers_Should_NotBeUsedDirectly()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .DoNotHaveName("IDomainEventHandler`1")
            .Should()
            .ImplementInterface(typeof(INotificationHandler<>))
            .GetTypes()
            .AssertOnlyHaveRequestHandlers(typeof(INotificationHandler<>));
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Endpoints_Should_BeNonPublic()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictEndpoints()
            .Should()
            .NotBePublic()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Endpoints_Should_BeSealed()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictEndpoints()
            .Should()
            .BeSealed()
            .GetResult()
            .ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Endpoints_Should_HaveEndpointPostfix()
    {
        Types
            .InAssembly(IdentityAssembly)
            .That()
            .PredictEndpoints()
            .Should()
            .HaveNameEndingWith("Endpoint", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }
}
