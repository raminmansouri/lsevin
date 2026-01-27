using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the tests for the <see cref="ValueObject"/> class.
/// </summary>
public class ValueObjectTests : SeedWorkBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CheckRule_WhenRuleBroken_ShouldThrowBusinessRuleValidationException()
    {
        // Arrange
        var valueObject = new TestValueObject(1);
        var rule = new TestBusinessRule(isBroken: true);

        // Act & Assert
        AssertBrokenRule<TestBusinessRule>(
            testDelegate: () => TestValueObject.TriggerBusinessRule(rule),
            message: TestBusinessRule.TestMessage
        );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void TriggerBusinessRule_WhenRuleNotBroken_ShouldNotThrowException()
    {
        // Arrange
        var valueObject = new TestValueObject(1);
        var rule = new TestBusinessRule(isBroken: false);

        // Act
        TestValueObject.TriggerBusinessRule(rule);

        // Assert
        valueObject.Should().NotBeNull();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ValueObjects_WhenSameValues_ShouldBeEqual()
    {
        // Arrange
        var valueObject1 = new TestValueObject(1);
        var valueObject2 = new TestValueObject(1);

        // Act
        var result = valueObject1 == valueObject2;

        // Assert
        valueObject1.Should().Be(valueObject2);
        result.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ValueObjects_WhenDifferentValues_ShouldNotBeEqual()
    {
        // Arrange
        var valueObject1 = new TestValueObject(1);
        var valueObject2 = new TestValueObject(2);

        // Act
        var result = valueObject1 != valueObject2;

        // Assert
        valueObject1.Should().NotBe(valueObject2);
        result.Should().BeTrue();
    }
}
