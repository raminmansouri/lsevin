using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Validation.Middlewares;
using FluentValidation;
using FluentValidation.Results;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using MediatR;
using Microsoft.Extensions.Logging.Abstractions;
using ValidationException = BuildingBlocks.Validation.Common.ValidationException;

namespace LSevin.UnitTests.Behaviors;

/// <summary>
/// Represents the base test for the <see cref="ValidationBehavior{TRequest,TResponse}"/> class.
/// </summary>
public class ValidationBehaviorTests : BaseUnitTest
{
    #region Constructor

    private static readonly string _testPropValue = Faker.Random.String(10);
    private readonly IValidator<TestValidationCommand> _mockValidator;
    private readonly ValidationBehavior<TestValidationCommand, bool> _behavior;

    /// <summary>
    /// Initializes a new instance of the <see cref="ValidationBehaviorTests"/> class.
    /// </summary>
    public ValidationBehaviorTests()
    {
        _mockValidator = Substitute.For<IValidator<TestValidationCommand>>();
        var mockLogger = NullLogger<ValidationBehavior<TestValidationCommand, bool>>.Instance;
        _behavior = new ValidationBehavior<TestValidationCommand, bool>([_mockValidator], mockLogger);
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenValidationPasses_ShouldCallNextDelegate()
    {
        // Arrange
        var command = new TestValidationCommand(_testPropValue);
        _mockValidator
            .ValidateAsync(Arg.Any<TestValidationCommand>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        // Act
        var result = await _behavior.Handle(command, _ => Task.FromResult(true), CancellationToken.None);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public Task Handle_WhenValidationFails_ShouldThrowValidationException()
    {
        // Arrange
        var command = new TestValidationCommand(string.Empty);
        var validationFailures = new List<ValidationFailure>
        {
            new(
                nameof(TestValidationCommand.TestProp),
                AppError.RequiredMessage(nameof(TestValidationCommand.TestProp))
            ),
        };
        _mockValidator
            .ValidateAsync(Arg.Any<TestValidationCommand>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult(validationFailures));

        // Act & Assert
        return _behavior
            .Invoking(b => b.Handle(command, _ => Task.FromResult(true), CancellationToken.None))
            .Should()
            .ThrowAsync<ValidationException>();
    }

    /// <summary>
    /// Represents a test command.
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the <see cref="TestValidationCommand"/> class.
    /// </remarks>
    /// <param name="TestProp">The test property.</param>
    public sealed record TestValidationCommand(string TestProp) : Command<bool>, IRequest<bool>;
}
