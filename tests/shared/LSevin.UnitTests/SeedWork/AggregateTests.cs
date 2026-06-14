using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the tests for the <see cref="AggregateRoot{TId}"/> class.
/// </summary>
public class AggregateTests : SeedWorkBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void AddDomainEvent_WhenInstantiated_ShouldAddEvent()
    {
        // Arrange
        var aggregate = new TestAggregateRoot(new TestTypedId(Faker.Random.Guid()));
        var domainEvent = new TestDomainEvent(Faker.Random.Guid());

        // Act
        aggregate.AddEvent(domainEvent);

        // Assert
        aggregate.DomainEvents.Should().Contain(domainEvent);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void RemoveDomainEvent_WhenInstantiated_ShouldRemoveEvent()
    {
        // Arrange
        var aggregate = new TestAggregateRoot(new TestTypedId(Faker.Random.Guid()));
        var domainEvent = new TestDomainEvent(Faker.Random.Guid());
        aggregate.AddEvent(domainEvent);

        // Act
        aggregate.RemoveDomainEvent(domainEvent);

        // Assert
        aggregate.DomainEvents.Should().NotContain(domainEvent);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ClearDomainEvents_WhenCalled_ShouldRemoveAllEvents()
    {
        // Arrange
        var aggregate = new TestAggregateRoot(new TestTypedId(Faker.Random.Guid()));
        var domainEvent = new TestDomainEvent(Faker.Random.Guid());
        aggregate.AddEvent(domainEvent);

        // Act
        aggregate.ClearDomainEvents();

        // Assert
        aggregate.DomainEvents.Should().BeEmpty();
    }
}
