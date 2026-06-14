using BuildingBlocks.Core.Logging.Middlewares;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using MediatR;
using Microsoft.Extensions.Logging;
using ISerializer = BuildingBlocks.Core.Serialization.ISerializer;

namespace LSevin.UnitTests.Behaviors;

/// <summary>
/// Represents the unit tests for the <see cref="LoggingBehavior{TRequest,TResponse}"/> class.
/// </summary>
public class LoggingBehaviorTests : BaseUnitTest
{
    #region Constants

    private const string StartingLogMessage = $"Starting to handle {nameof(TestLoggingRequest)}";
    private const string FinishedLogMessage = $"Finished handling request Request {nameof(TestLoggingRequest)}";

    #endregion

    #region Constructor

    private readonly ILogger<LoggingBehavior<TestLoggingRequest, Result<bool>>> _mockLogger;
    private readonly ISerializer _mockSerializer;
    private readonly LoggingBehavior<TestLoggingRequest, Result<bool>> _behavior;

    /// <summary>
    /// Initializes a new instance of the <see cref="LoggingBehaviorTests"/> class.
    /// </summary>
    public LoggingBehaviorTests()
    {
        _mockLogger = Substitute.For<ILogger<LoggingBehavior<TestLoggingRequest, Result<bool>>>>();
        _mockSerializer = Substitute.For<ISerializer>();
        _behavior = new LoggingBehavior<TestLoggingRequest, Result<bool>>(_mockLogger, _mockSerializer);
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenSuccess_ShouldLogSuccess()
    {
        // Arrange
        var request = new TestLoggingRequest();
        var response = Faker.Random.String(10);
        var expectedResponse = Result.Success(value: true);
        _mockSerializer.Serialize(Arg.Any<Result<bool>>(), Arg.Any<bool>()).Returns(response);

        // Act
        var result = await _behavior.Handle(request, _ => Task.FromResult(expectedResponse), CancellationToken.None);

        // Assert
        result.Should().Be(expectedResponse);

        _mockLogger
            .Received(1)
            .Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains(StartingLogMessage)),
                null,
                Arg.Any<Func<object, Exception, string>>()!
            );

        _mockLogger
            .Received(1)
            .Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains(FinishedLogMessage)),
                null,
                Arg.Any<Func<object, Exception, string>>()!
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenException_ShouldLogException()
    {
        // Arrange
        var request = new TestLoggingRequest();
        var expectedException = new Exception(nameof(TestLoggingRequest));

        // Act & Assert
        await FluentActions
            .Invoking(() => _behavior.Handle(request, _ => throw expectedException, CancellationToken.None))
            .Should()
            .ThrowAsync<Exception>();

        _mockLogger
            .Received(1)
            .Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains(StartingLogMessage)),
                null,
                Arg.Any<Func<object, Exception, string>>()!
            );

        _mockLogger
            .DidNotReceive()
            .Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains(FinishedLogMessage)),
                null,
                Arg.Any<Func<object, Exception, string>>()!
            );
    }

    /// <summary>
    /// Represents a test request.
    /// </summary>
    public sealed class TestLoggingRequest : IRequest<Result<bool>>;
}
