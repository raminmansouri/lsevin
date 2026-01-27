using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the tests for the <see cref="Entity{T}"/> class.
/// </summary>
public class EntityTests : SeedWorkBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CheckRule_WhenRuleBroken_ShouldThrowBusinessRuleValidationException()
    {
        // Arrange
        var entity = new TestEntity(new TestTypedId(Faker.Random.Guid()));
        var rule = new TestBusinessRule(isBroken: true);

        // Act & Assert
        AssertBrokenRule<TestBusinessRule>(
            testDelegate: () => TestEntity.TriggerBusinessRule(rule),
            message: TestBusinessRule.TestMessage
        );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void TriggerBusinessRule_WhenRuleNotBroken_ShouldNotThrowException()
    {
        // Arrange
        var entity = new TestEntity(new TestTypedId(Faker.Random.Guid()));
        var rule = new TestBusinessRule(isBroken: false);

        // Act
        TestEntity.TriggerBusinessRule(rule);

        // Assert
        entity.Should().NotBeNull();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void SetCreateDate_WhenCalled_ShouldSetCreateDate()
    {
        // Arrange
        var entity = new TestEntity(new TestTypedId(Faker.Random.Guid()));
        var createDate = SystemClock.Now;

        // Act
        entity.SetCreateDate(createDate);

        // Assert
        entity.CreateDate.Should().Be(createDate);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void SetModifiedDate_WhenCalled_ShouldSetLastModifiedDate()
    {
        // Arrange
        var entity = new TestEntity(new TestTypedId(Faker.Random.Guid()));
        var modifiedDate = SystemClock.Now;

        // Act
        entity.SetModifiedDate(modifiedDate);

        // Assert
        entity.LastModifiedDate.Should().Be(modifiedDate);
    }
}
