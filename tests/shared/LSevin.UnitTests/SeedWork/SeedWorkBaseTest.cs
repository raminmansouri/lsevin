using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.SeedWork;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class SeedWorkBaseTest : BaseDomainUnitTest
{
    /// <summary>
    /// Represents the test typed identifier.
    /// </summary>
    protected sealed record TestTypedId(Guid Value) : TypedIdValueBase(Value);

    /// <summary>
    /// Represents the test entity.
    /// </summary>
    protected class TestEntity : Entity<TestTypedId>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TestEntity"/> class.
        /// </summary>
        /// <param name="id">The identifier.</param>
        public TestEntity(TestTypedId id) => Id = id;

        /// <summary>
        /// Checks the specified business rule and throws a <see cref="BusinessRuleValidationException"/> if it's broken.
        /// </summary>
        /// <param name="rule">The business rule to check.</param>
        public static void TriggerBusinessRule(IBusinessRule rule)
        {
            CheckRule(rule);
        }
    }

    /// <summary>
    /// Represents the test value object.
    /// </summary>
    protected class TestValueObject(int value) : ValueObject
    {
        /// <summary>
        /// Gets the value.
        /// </summary>
        private int Value { get; } = value;

        /// <inheritdoc />
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }

        /// <summary>
        /// Checks the specified business rule and throws a <see cref="BusinessRuleValidationException"/> if it's broken.
        /// </summary>
        /// <param name="rule">The business rule to check.</param>
        public static void TriggerBusinessRule(IBusinessRule rule)
        {
            CheckRule(rule);
        }
    }

    /// <summary>
    /// Represents the test aggregate root.
    /// </summary>
    protected class TestAggregateRoot : AggregateRoot<TestTypedId>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TestAggregateRoot"/> class.
        /// </summary>
        /// <param name="id">The identifier.</param>
        public TestAggregateRoot(TestTypedId id) => Id = id;

        /// <summary>
        /// Adds a domain event to the aggregate root.
        /// </summary>
        /// <param name="domainEvent">The domain event.</param>
        public void AddEvent(TestDomainEvent domainEvent)
        {
            AddDomainEvent(domainEvent);
        }
    }

    /// <summary>
    /// Represents the test domain event.
    /// </summary>
    protected record TestDomainEvent(Guid TestId) : DomainEvent;

    /// <summary>
    /// Represents the test business rule.
    /// </summary>
    protected class TestBusinessRule(bool isBroken) : IBusinessRule
    {
        internal const string TestMessage = "Test Message";

        /// <inheritdoc />
        public bool IsBroken() => isBroken;

        /// <inheritdoc />
        public string Message { get; } = TestMessage;
    }
}
