using System.Security.Claims;
using BuildingBlocks.Caching.Middlewares;
using BuildingBlocks.Caching.Services;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Commands;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace LSevin.UnitTests.Behaviors;

/// <summary>
/// Represents the tests for the <see cref="InvalidateCachingBehavior{TRequest,TResponse}"/> class.
/// </summary>
public class InvalidateCachingBehaviorTests : CommandsBaseTest
{
    #region Fields

    private readonly ICachingService _mockCachingService;
    private readonly IHttpContextAccessor _mockHttpContextAccessor;
    private readonly InvalidateCachingBehavior<TestCommand, string> _behavior;
    private readonly Guid _userId;

    #endregion

    #region Constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="InvalidateCachingBehaviorTests"/> class.
    /// </summary>
    public InvalidateCachingBehaviorTests()
    {
        _mockCachingService = Substitute.For<ICachingService>();
        _mockHttpContextAccessor = Substitute.For<IHttpContextAccessor>();
        var mockLogger = NullLogger<InvalidateCachingBehavior<TestCommand, string>>.Instance;
        _behavior = new InvalidateCachingBehavior<TestCommand, string>(
            _mockHttpContextAccessor,
            _mockCachingService,
            mockLogger
        );

        _userId = Faker.Random.Guid();
        SetupHttpContext();
    }

    #endregion

    #region Tests

    /// <summary>
    /// Tests that when no cache keys are provided, the cache is not invalidated.
    /// </summary>
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenNoCacheKeys_ShouldNotInvalidateCache()
    {
        // Arrange
        var request = new TestCommand();

        // Act
        await _behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        await _mockCachingService
            .DidNotReceive()
            .RemoveAllAsync(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Tests that when cache keys are provided, the cache is invalidated with the correct keys.
    /// </summary>
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenCacheKeys_ShouldInvalidateCache()
    {
        // Arrange
        var request = new TestCommand();
        request.AddQueryToInvalidate(typeof(TestQuery));

        var expectedCacheKey = $"{nameof(TestQuery)}_user:{_userId}";

        // Act
        await _behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .RemoveAllAsync(
                Arg.Is<IReadOnlyCollection<string>>(keys => keys.Count == 1 && keys.First() == expectedCacheKey),
                Arg.Any<CancellationToken>()
            );
    }

    /// <summary>
    /// Tests that when headers are disabled, they are not included in the cache key.
    /// </summary>
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenHeadersDisabled_ShouldNotIncludeHeaders()
    {
        // Arrange
        var request = new TestCommand();
        request.AddQueryToInvalidate(typeof(TestQuery));
        request.SetAppendRequestHeaders(false);

        _mockHttpContextAccessor.HttpContext!.Request.Headers["X-Custom-Header"] = "test-value";
        var expectedCacheKey = $"{nameof(TestQuery)}_user:{_userId}";

        // Act
        await _behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .RemoveAllAsync(
                Arg.Is<IReadOnlyCollection<string>>(keys => keys.Count == 1 && keys.First() == expectedCacheKey),
                Arg.Any<CancellationToken>()
            );
    }

    /// <summary>
    /// Tests that when headers are enabled, they are included in the cache key.
    /// </summary>
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenHeadersEnabled_ShouldIncludeCustomHeaders()
    {
        // Arrange
        var request = new TestCommand();
        request.AddQueryToInvalidate(typeof(TestQuery));

        var customHeaderValue = "test-value";
        _mockHttpContextAccessor.HttpContext!.Request.Headers["X-Custom-Header"] = customHeaderValue;

        var expectedCacheKey = $"{nameof(TestQuery)}_user:{_userId}_X-Custom-Header:{customHeaderValue}";

        // Act
        await _behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .RemoveAllAsync(
                Arg.Is<IReadOnlyCollection<string>>(keys => keys.Count == 1 && keys.First() == expectedCacheKey),
                Arg.Any<CancellationToken>()
            );
    }

    #endregion

    #region Privates

    /// <summary>
    /// Sets up the HTTP context with a test user.
    /// </summary>
    private void SetupHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, _userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        _mockHttpContextAccessor.HttpContext.Returns(httpContext);
    }

    #endregion
}
