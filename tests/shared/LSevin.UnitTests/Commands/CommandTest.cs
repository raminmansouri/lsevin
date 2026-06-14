using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.Commands;

/// <summary>
/// Represents the tests for the <see cref="Command{TResponse}"/> class.
/// </summary>
public class CommandTest : CommandsBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CommandBase_WhenInstantiated_ShouldInitializeProperties()
    {
        // Arrange & Act
        var command = new TestCommand();

        // Assert
        command.Id.Should().NotBe(IdGenerator.EmptyId);
        command.CacheKeys.Should().BeEmpty();
        command.AppendRequestHeaders.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void InternalCommandBase_WhenInstantiated_ShouldInitializeProperties()
    {
        // Arrange & Act
        var internalCommand = new TestInternalCommand();

        // Assert
        internalCommand.Id.Should().NotBe(IdGenerator.EmptyId);
        internalCommand.CacheKeys.Should().BeEmpty();
        internalCommand.AppendRequestHeaders.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CommandBase_WhenAddQueryToInvalidate_ShouldAddQueryTypeToKeys()
    {
        // Arrange
        var command = new TestCommand();

        // Act
        command.AddQueryToInvalidate(typeof(TestQuery));

        // Assert
        command.CacheKeys.Should().ContainSingle();
        command.CacheKeys.First().Should().Be(nameof(TestQuery));
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CommandBase_WhenAddQueriesToInvalidate_ShouldAddMultipleQueryTypesToKeys()
    {
        // Arrange
        var command = new TestCommand();
        var queryTypes = new[] { typeof(TestQuery), typeof(TestQuery2) };

        // Act
        command.AddQueriesToInvalidate(queryTypes);

        // Assert
        command.CacheKeys.Should().HaveCount(2);
        command.CacheKeys.Should().Contain(nameof(TestQuery));
        command.CacheKeys.Should().Contain(nameof(TestQuery2));
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CommandBase_WhenSetAppendRequestHeaders_ShouldUpdateAppendRequestHeaders()
    {
        // Arrange
        var command = new TestCommand();

        // Act
        command.SetAppendRequestHeaders(false);

        // Assert
        command.AppendRequestHeaders.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void InternalCommandBase_WhenAddQueryToInvalidate_ShouldAddQueryTypeToKeys()
    {
        // Arrange
        var command = new TestInternalCommand();

        // Act
        command.AddQueryToInvalidate(typeof(TestQuery));

        // Assert
        command.CacheKeys.Should().ContainSingle();
        command.CacheKeys.First().Should().Be(nameof(TestQuery));
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void InternalCommandBase_WhenAddQueriesToInvalidate_ShouldAddMultipleQueryTypesToKeys()
    {
        // Arrange
        var command = new TestInternalCommand();
        var queryTypes = new[] { typeof(TestQuery), typeof(TestQuery2) };

        // Act
        command.AddQueriesToInvalidate(queryTypes);

        // Assert
        command.CacheKeys.Should().HaveCount(2);
        command.CacheKeys.Should().Contain(nameof(TestQuery));
        command.CacheKeys.Should().Contain(nameof(TestQuery2));
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void InternalCommandBase_WhenSetAppendRequestHeaders_ShouldUpdateAppendRequestHeaders()
    {
        // Arrange
        var command = new TestInternalCommand();

        // Act
        command.SetAppendRequestHeaders(false);

        // Assert
        command.AppendRequestHeaders.Should().BeFalse();
    }
}
