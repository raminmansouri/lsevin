using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the tests for the <see cref="DomainEvent"/> class.
/// </summary>
public class DomainEventTests : SeedWorkBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void DomainEventBase_WhenInstantiated_ShouldInitializeProperties()
    {
        // Arrange
        var entityId = Faker.Random.Guid();

        // Act
        var domainEvent = new TestDomainEvent(entityId);

        // Assert
        domainEvent.Id.Should().NotBe(IdGenerator.EmptyId);
        domainEvent.OccurredOn.Should().NotBe(default);
    }
}
