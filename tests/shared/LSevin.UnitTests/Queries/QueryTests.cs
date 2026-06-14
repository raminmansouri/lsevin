using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Queries;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.Queries;

/// <summary>
/// Represents the tests for the <see cref="Query{TResponse}"/> and <see cref="CachedQuery{TResponse}"/> classes.
/// </summary>
public class QueryTests : QueriesBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void QueryBase_WhenInstantiated_ShouldInitializeProperties()
    {
        // Arrange

        // Act
        var query = new TestQuery();

        // Assert
        query.Id.Should().NotBe(IdGenerator.EmptyId);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenInstantiated_ShouldInitializeProperties()
    {
        // Arrange

        // Act
        var cachedQuery = new TestCachedQuery();

        // Assert
        cachedQuery.Id.Should().NotBe(IdGenerator.EmptyId);
        cachedQuery.IsCacheEnabled.Should().BeTrue();
        cachedQuery.CacheKey.Should().BeEmpty();
        cachedQuery.CacheDuration.Should().Be(default);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenDisableCaching_ShouldSetIsCacheEnabledToFalse()
    {
        // Arrange
        var cachedQuery = new TestCachedQuery();

        // Act
        cachedQuery.DisableCaching();

        // Assert
        cachedQuery.IsCacheEnabled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenSetCacheDuration_ShouldSetCacheDuration()
    {
        // Arrange
        var cachedQuery = new TestCachedQuery();
        var duration = TimeSpan.FromMinutes(Faker.Random.Int(1, 10));

        // Act
        cachedQuery.SetCacheDuration(duration);

        // Assert
        cachedQuery.CacheDuration.Should().Be(duration);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenCustomizeCacheKey_ShouldSetCacheKey()
    {
        // Arrange
        var cachedQuery = new TestCachedQuery();
        var customKeyPart = Faker.Lorem.Word();

        // Act
        cachedQuery.CustomizeCacheKey(customKeyPart);

        // Assert
        cachedQuery.CacheKey.Should().Be($"{typeof(TestCachedQuery).FullName}:{customKeyPart}");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenInstantiated_ShouldInitializePropertiesWithDefaults()
    {
        // Arrange & Act
        var cachedQuery = new TestCachedQuery();

        // Assert
        cachedQuery.Id.Should().NotBe(IdGenerator.EmptyId);
        cachedQuery.IsCacheEnabled.Should().BeTrue();
        cachedQuery.AppendRequestHeaders.Should().BeTrue();
        cachedQuery.CacheKey.Should().BeEmpty();
        cachedQuery.CacheDuration.Should().Be(default);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenSetAppendRequestHeaders_ShouldUpdateAppendRequestHeaders()
    {
        // Arrange
        var cachedQuery = new TestCachedQuery();

        // Act
        cachedQuery.SetAppendRequestHeaders(false);

        // Assert
        cachedQuery.AppendRequestHeaders.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void CachedQuery_WhenDisableCachingAndSetAppendRequestHeaders_ShouldMaintainIndependentFlags()
    {
        // Arrange
        var cachedQuery = new TestCachedQuery();

        // Act
        cachedQuery.DisableCaching();
        cachedQuery.SetAppendRequestHeaders(false);

        // Assert
        cachedQuery.IsCacheEnabled.Should().BeFalse();
        cachedQuery.AppendRequestHeaders.Should().BeFalse();
    }
}
