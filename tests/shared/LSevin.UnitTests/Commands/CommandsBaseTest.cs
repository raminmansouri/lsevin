using BuildingBlocks.Core.Messaging.Commands;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.Commands;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class CommandsBaseTest : BaseUnitTest
{
    /// <summary>
    /// Represents the test command.
    /// </summary>
    protected record TestCommand : Command<string>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TestCommand"/> class.
        /// </summary>
        public TestCommand() { }

        /// <summary>
        /// Initializes a new instance of the <see cref="TestCommand"/> class.
        /// </summary>
        /// <param name="id">The identifier.</param>
        public TestCommand(Guid id)
            : base(id) { }

        /// <summary>
        /// Exposes the protected AddQueryToInvalidate method for testing.
        /// </summary>
        /// <param name="queryType">The query type to invalidate.</param>
        public new void AddQueryToInvalidate(Type queryType) => base.AddQueryToInvalidate(queryType);

        /// <summary>
        /// Exposes the protected AddQueriesToInvalidate method for testing.
        /// </summary>
        /// <param name="queryTypes">The query types to invalidate.</param>
        public new void AddQueriesToInvalidate(IEnumerable<Type> queryTypes) => base.AddQueriesToInvalidate(queryTypes);

        /// <summary>
        /// Exposes the protected SetAppendRequestHeaders method for testing.
        /// </summary>
        /// <param name="append">Whether to append request headers.</param>
        public new void SetAppendRequestHeaders(bool append) => base.SetAppendRequestHeaders(append);
    }

    /// <summary>
    /// Represents the test internal command.
    /// </summary>
    protected record TestInternalCommand : InternalCommand
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TestInternalCommand"/> class.
        /// </summary>
        public TestInternalCommand() { }

        /// <summary>
        /// Exposes the protected AddQueryToInvalidate method for testing.
        /// </summary>
        /// <param name="queryType">The query type to invalidate.</param>
        public new void AddQueryToInvalidate(Type queryType) => base.AddQueryToInvalidate(queryType);

        /// <summary>
        /// Exposes the protected AddQueriesToInvalidate method for testing.
        /// </summary>
        /// <param name="queryTypes">The query types to invalidate.</param>
        public new void AddQueriesToInvalidate(IEnumerable<Type> queryTypes) => base.AddQueriesToInvalidate(queryTypes);

        /// <summary>
        /// Exposes the protected SetAppendRequestHeaders method for testing.
        /// </summary>
        /// <param name="append">Whether to append request headers.</param>
        public new void SetAppendRequestHeaders(bool append) => base.SetAppendRequestHeaders(append);
    }

    /// <summary>
    /// Represents a test query type for cache invalidation.
    /// </summary>
    protected sealed class TestQuery { }

    /// <summary>
    /// Represents another test query type for cache invalidation.
    /// </summary>
    protected sealed class TestQuery2 { }
}
