using BuildingBlocks.Core.Messaging.Queries;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.Queries;

/// <summary>
/// Base class for query tests.
/// </summary>
public abstract class QueriesBaseTest : BaseUnitTest
{
    /// <summary>
    /// A test implementation of <see cref="Query{TResponse}"/>.
    /// </summary>
    protected record TestQuery : Query<string>;

    /// <summary>
    /// A test implementation of <see cref="CachedQuery{TResponse}"/>.
    /// </summary>
    protected record TestCachedQuery : CachedQuery<string>
    {
        /// <summary>
        /// Represents the test implementation of <see cref="CachedQuery{TResponse}.DisableCaching"/>.
        /// </summary>
        public new void DisableCaching() => base.DisableCaching();

        /// <summary>
        /// Represents the test implementation of <see cref="CachedQuery{TResponse}"/>.
        /// </summary>
        /// <param name="duration"></param>
        public new void SetCacheDuration(TimeSpan duration) => base.SetCacheDuration(duration);

        /// <summary>
        /// Represents the test implementation of <see cref="CachedQuery{TResponse}"/>.
        /// </summary>
        /// <param name="customKeyPart"></param>
        public new void CustomizeCacheKey(string customKeyPart) => base.CustomizeCacheKey(customKeyPart);

        /// <summary>
        /// Represents the test implementation of <see cref="CachedQuery{TResponse}"/>.
        /// </summary>
        /// <param name="append"></param>
        public new void SetAppendRequestHeaders(bool append) => base.SetAppendRequestHeaders(append);
    }
}
