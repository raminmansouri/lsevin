using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the tests for the <see cref="TypedIdValueBase"/> class.
/// </summary>
public class TypedIdTests : SeedWorkBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void TypedId_WhenValidValueProvided_ShouldStoreValue()
    {
        // Arrange
        var guid = Faker.Random.Guid();
        var typedId = new TestTypedId(guid);

        // Assert
        typedId.Value.Should().Be(guid);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void TypedId_WhenInvalidValueProvided_ShouldThrowCustomAppException()
    {
        // Arrange
        var guid = IdGenerator.EmptyId;

        // Assert
        FluentActions.Invoking(() => new TestTypedId(guid)).Should().Throw<Exception>();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Implicit_WhenConversionToGuid_ShouldReturnCorrectGuid()
    {
        // Arrange
        var guid = Faker.Random.Guid();
        var typedId = new TestTypedId(guid);

        // Act
        Guid result = typedId;

        // Assert
        result.Should().Be(guid);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Equality_WhenEqualValues_ShouldReturnTrue()
    {
        // Arrange
        var guid = Faker.Random.Guid();
        var typedId1 = new TestTypedId(guid);
        var typedId2 = new TestTypedId(guid);

        // Act
        var result = typedId1 == typedId2;

        // Assert
        typedId1.Should().Be(typedId2);
        result.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Equality_WhenDifferentValues_ShouldReturnFalse()
    {
        // Arrange
        var typedId1 = new TestTypedId(Faker.Random.Guid());
        var typedId2 = new TestTypedId(Faker.Random.Guid());

        // Act
        var result = typedId1 == typedId2;

        // Assert
        typedId1.Should().NotBe(typedId2);
        result.Should().BeFalse();
    }
}
