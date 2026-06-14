using BuildingBlocks.Core.Resiliency.Fallback;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using MediatR;
using Microsoft.Extensions.Logging.Abstractions;

namespace LSevin.UnitTests.Behaviors;

/// <summary>
/// Represents the tests for the <see cref="FallbackBehavior{TRequest,TResponse}"/> class.
/// </summary>
public class FallbackBehaviorTests : BaseUnitTest
{
    #region Constructor

    private readonly IFallbackHandler<TestFallbackRequest, string> _mockFallbackHandler;
    private readonly FallbackBehavior<TestFallbackRequest, string> _behavior;

    /// <summary>
    /// Initializes a new instance of the <see cref="FallbackBehaviorTests"/> class.
    /// </summary>
    public FallbackBehaviorTests()
    {
        _mockFallbackHandler = Substitute.For<IFallbackHandler<TestFallbackRequest, string>>();
        var mockLogger = NullLogger<FallbackBehavior<TestFallbackRequest, string>>.Instance;
        _behavior = new FallbackBehavior<TestFallbackRequest, string>([_mockFallbackHandler], mockLogger);
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenNoExceptionOccurs_ShouldReturnOriginalResult()
    {
        // Arrange
        var request = new TestFallbackRequest();
        const string expectedResult = "Original Result";

        // Act
        var result = await _behavior.Handle(request, _ => Task.FromResult(expectedResult), CancellationToken.None);

        // Assert
        result.Should().Be(expectedResult);
        await _mockFallbackHandler
            .DidNotReceive()
            .HandleFallbackAsync(Arg.Any<TestFallbackRequest>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenExceptionOccurs_ShouldUseFallbackHandler()
    {
        // Arrange
        var request = new TestFallbackRequest();
        const string fallbackResult = "Fallback Result";
        _mockFallbackHandler
            .HandleFallbackAsync(Arg.Any<TestFallbackRequest>(), Arg.Any<CancellationToken>())
            .Returns(fallbackResult);

        // Act
        var result = await _behavior.Handle(
            request,
            _ => throw new Exception(nameof(TestFallbackRequest)),
            CancellationToken.None
        );

        // Assert
        result.Should().Be(fallbackResult);
        await _mockFallbackHandler
            .Received(1)
            .HandleFallbackAsync(Arg.Any<TestFallbackRequest>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Represents the test request.
    /// </summary>
    public sealed class TestFallbackRequest : IRequest<string>;
}
