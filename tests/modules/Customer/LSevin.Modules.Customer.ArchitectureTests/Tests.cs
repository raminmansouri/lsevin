using BuildingBlocks.Core.ResultPattern;
using LSevin.Tests.Shared.Extensions;
using LSevin.Tests.Shared.Helpers;
using LSevin.Tests.Shared.XunitCategories;
using MediatR;
using NetArchTest.Rules;

namespace LSevin.Modules.Customer.ArchitectureTests;

/// <summary>
/// Represents the tests.
/// </summary>
public class Tests : BaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEvents_Should_BeImmutable()
    {
        Types.InAssembly(CustomerAssembly).That().PredictDomainEvents().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainEvents_Should_BeSealed()
    {
        Types
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
            .That()
            .PredictEntities()
            .GetTypes()
            .AssertHavePrivateParameterlessConstructor();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Entities_Should_OnlyHavePrivateSetters()
    {
        Types.InAssembly(CustomerAssembly).That().PredictEntities().GetTypes().AssertOnlyHavePrivateOrInitSetters();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void EntitiesFromAnAggregate_Should_NotReferenceOtherAggregateRoot()
    {
        var allEntities = Types.InAssembly(CustomerAssembly).That().PredictEntities().GetTypes().ToList();
        var aggregateRootTypes = Types.InAssembly(CustomerAssembly).That().PredictAggregateRoots().GetTypes().ToList();
        var nonAggregateEntities = allEntities.Where(x => !aggregateRootTypes.Contains(x)).ToList();

        nonAggregateEntities.AssertDoNotReferenceOtherTypes(aggregateRootTypes);
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_BeImmutable()
    {
        Types.InAssembly(CustomerAssembly).That().PredictValueObjects().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_HavePrivateConstructorsOnly()
    {
        Types.InAssembly(CustomerAssembly).That().PredictValueObjects().GetTypes().AssertHavePrivateConstructorsOnly();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void ValueObjects_Should_HaveConstructorWithJsonConstructorAttribute()
    {
        Types
            .InAssembly(CustomerAssembly)
            .That()
            .PredictValueObjects()
            .GetTypes()
            .AssertHaveConstructorWithJsonConstructorAttribute();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void TypedIds_Should_BeImmutable()
    {
        Types.InAssembly(CustomerAssembly).That().PredictTypedIds().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void TypedIds_Should_HaveIdPostfix()
    {
        Types
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
            .That()
            .PredictAggregateRoots()
            .GetTypes()
            .Select(t => $"I{t.Name.Replace("Aggregate", string.Empty, StringComparison.Ordinal)}")
            .ToList();

        var repositories = Types
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
        Types.InAssembly(CustomerAssembly).That().PredictDomainObjects().GetTypes().AssertHavePrivateConstructorsOnly();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void DomainObjects_Should_HaveStaticCreateMethod()
    {
        Types.InAssembly(CustomerAssembly).That().PredictDomainObjects().GetTypes().AssertHaveStaticCreateMethod();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Commands_Should_BeImmutable()
    {
        Types.InAssembly(CustomerAssembly).That().PredictCommands().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Commands_Should_BeSealed()
    {
        Types
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
        Types.InAssembly(CustomerAssembly).That().PredictQueries().GetTypes().AssertAreImmutable();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Queries_Should_BeSealed()
    {
        Types.InAssembly(CustomerAssembly).That().PredictQueries().Should().BeSealed().GetResult().ShouldBeSuccessful();
    }

    [Fact]
    [CategoryTrait(TestCategory.Architecture)]
    public void Queries_Should_HaveQueryPostfix()
    {
        Types
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
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
            .InAssembly(CustomerAssembly)
            .That()
            .PredictEndpoints()
            .Should()
            .HaveNameEndingWith("Endpoint", StringComparison.Ordinal)
            .GetResult()
            .ShouldBeSuccessful();
    }
}
