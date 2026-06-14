using System.Security.Claims;
using BuildingBlocks.Caching.Middlewares;
using BuildingBlocks.Caching.Options;
using BuildingBlocks.Caching.Services;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Queries;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace LSevin.UnitTests.Behaviors;

/// <summary>
/// Represents the base test for the <see cref="CachingBehavior{TRequest,TResponse}"/> class.
/// </summary>
public class CachingBehaviorBaseTest : QueriesBaseTest
{
    /// <summary>
    /// The cache settings.
    /// </summary>
    protected readonly CacheOptions CacheSettings = new()
    {
        Enabled = true,
        QueryCacheTimeInMinutes = 30,
        AuthConfigCacheTimeInMinutes = 1440,
    };

    /// <summary>
    /// The cache response.
    /// </summary>
    protected readonly string CachedResponse = Faker.Random.String(10);

    /// <summary>
    /// The new response.
    /// </summary>
    protected readonly string NewResponse = Faker.Random.String(10);

    /// <summary>
    /// The user ID.
    /// </summary>
    protected readonly Guid UserId = Faker.Random.Guid();
}

/// <summary>
/// Represents the tests for the <see cref="CachingBehavior{TRequest, TResponse}"/> class.
/// </summary>
public class CachingBehaviorTests : CachingBehaviorBaseTest
{
    #region Constructor

    private readonly ICachingService _mockCachingService;
    private readonly IHttpContextAccessor _mockHttpContextAccessor;
    private readonly CachingBehavior<TestCachedQuery, string> _behavior;

    /// <summary>
    /// Initializes a new instance of the <see cref="CachingBehaviorTests"/> class.
    /// </summary>
    public CachingBehaviorTests()
    {
        _mockCachingService = Substitute.For<ICachingService>();
        _mockHttpContextAccessor = Substitute.For<IHttpContextAccessor>();
        var mockCacheOptions = Substitute.For<IOptions<CacheOptions>>();
        mockCacheOptions.Value.Returns(CacheSettings);

        var mockLogger = NullLogger<CachingBehavior<TestCachedQuery, string>>.Instance;
        _behavior = new CachingBehavior<TestCachedQuery, string>(
            _mockHttpContextAccessor,
            _mockCachingService,
            mockCacheOptions,
            mockLogger
        );

        SetupHttpContext();
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenCacheHit_ShouldReturnCachedResponse()
    {
        // Arrange
        var request = new TestCachedQuery();
        _mockCachingService.GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(CachedResponse);

        // Act
        var result = await _behavior.Handle(request, _ => Task.FromResult("New Response"), CancellationToken.None);

        // Assert
        result.Should().Be(CachedResponse);
        await _mockCachingService.Received(1).GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await _mockCachingService
            .DidNotReceive()
            .SetAsync(
                Arg.Any<string>(),
                Arg.Any<object>(),
                Arg.Any<TimeSpan>(),
                Arg.Any<List<string>>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenCacheMiss_ShouldSetCacheAndReturnNewResponse()
    {
        // Arrange
        var request = new TestCachedQuery();
        _mockCachingService.GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((string?)null);

        // Act
        var result = await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        result.Should().Be(NewResponse);
        await _mockCachingService.Received(1).GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await _mockCachingService
            .Received(1)
            .SetAsync(
                Arg.Any<string>(),
                Arg.Is<string>(r => r == NewResponse),
                Arg.Any<TimeSpan>(),
                Arg.Any<List<string>>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenCachingDisabled_ShouldSkipCacheAndReturnNewResponse()
    {
        // Arrange
        var request = new TestCachedQuery();
        request.DisableCaching();

        // Act
        var result = await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        result.Should().Be(NewResponse);
        await _mockCachingService.DidNotReceive().GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await _mockCachingService
            .DidNotReceive()
            .SetAsync(
                Arg.Any<string>(),
                Arg.Any<object>(),
                Arg.Any<TimeSpan>(),
                Arg.Any<List<string>>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenUserSpecified_ShouldUseCorrectCacheKey()
    {
        // Arrange
        var request = new TestCachedQuery();
        _mockCachingService.GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((string?)null);

        // Act
        await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .GetAsync<string>(
                Arg.Is<string>(key => key == $"{nameof(TestCachedQuery)}_user:{UserId}"),
                Arg.Any<CancellationToken>()
            );
        await _mockCachingService
            .Received(1)
            .SetAsync(
                Arg.Is<string>(key => key == $"{nameof(TestCachedQuery)}_user:{UserId}"),
                Arg.Any<string>(),
                Arg.Any<TimeSpan>(),
                Arg.Any<List<string>>(),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenCustomCacheKeySpecified_ShouldUseCorrectCacheKeyFormat()
    {
        // Arrange
        var customKey = "CustomKey";
        var request = new TestCachedQuery();
        request.CustomizeCacheKey(customKey);
        _mockCachingService.GetAsync<string>(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((string?)null);

        // Act
        await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .GetAsync<string>(
                Arg.Is<string>(key =>
                    key.StartsWith($"{nameof(TestCachedQuery)}_")
                    && key.Contains(customKey)
                    && key.Contains($"user:{UserId}")
                ),
                Arg.Any<CancellationToken>()
            );
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenHeadersDisabled_ShouldNotIncludeHeaders()
    {
        // Arrange
        var request = new TestCachedQuery();
        request.SetAppendRequestHeaders(false);

        // Add custom header
        _mockHttpContextAccessor.HttpContext!.Request.Headers["X-Custom-Header"] = "test-value";
        var expectedCacheKey = $"{nameof(TestCachedQuery)}_user:{UserId}";

        // Act
        await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .GetAsync<string>(Arg.Is<string>(key => key == expectedCacheKey), Arg.Any<CancellationToken>());
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Handle_WhenHeadersEnabled_ShouldIncludeCustomHeaders()
    {
        // Arrange
        var request = new TestCachedQuery();
        var customHeaderValue = "test-value";
        _mockHttpContextAccessor.HttpContext!.Request.Headers["X-Custom-Header"] = customHeaderValue;

        var expectedCacheKey = $"{nameof(TestCachedQuery)}_user:{UserId}_X-Custom-Header:{customHeaderValue}";

        // Act
        await _behavior.Handle(request, _ => Task.FromResult(NewResponse), CancellationToken.None);

        // Assert
        await _mockCachingService
            .Received(1)
            .GetAsync<string>(Arg.Is<string>(key => key == expectedCacheKey), Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Sets up the HTTP context.
    /// </summary>
    private void SetupHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, UserId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        _mockHttpContextAccessor.HttpContext.Returns(httpContext);
    }
}
