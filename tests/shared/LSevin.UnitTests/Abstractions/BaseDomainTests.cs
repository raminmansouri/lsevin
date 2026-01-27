using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;

namespace LSevin.UnitTests.Abstractions;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class BaseDomainUnitTest : BaseUnitTest
{
    /// <summary>
    /// Asserts that the domain event was published.
    /// </summary>
    /// <typeparam name="T">The type of the domain event.</typeparam>
    /// <param name="aggregate">The aggregate.</param>
    /// <returns>The domain event.</returns>
    protected static T AssertDomainEventWasPublished<T>(IAggregateRoot aggregate)
        where T : IDomainEvent
    {
        var domainEvent = DomainEventsTestHelper.GetAllDomainEvents(aggregate).OfType<T>().FirstOrDefault();

        domainEvent.Should().NotBeNull();

        return domainEvent!;
    }

    /// <summary>
    /// Asserts that the domain event was not published.
    /// </summary>
    /// <typeparam name="T">The type of the domain event.</typeparam>
    /// <param name="aggregate">The aggregate.</param>
    protected static void AssertDomainEventNotPublished<T>(IAggregateRoot aggregate)
        where T : IDomainEvent
    {
        var domainEvent = DomainEventsTestHelper.GetAllDomainEvents(aggregate).OfType<T>().FirstOrDefault();
        domainEvent.Should().BeNull();
    }

    /// <summary>
    /// Asserts that the domain events were published.
    /// </summary>
    /// <typeparam name="T">The type of the domain event.</typeparam>
    /// <param name="aggregate">The aggregate.</param>
    /// <returns>A list of domain events.</returns>
    protected static IList<T> AssertPublishedDomainEvents<T>(IAggregateRoot aggregate)
        where T : IDomainEvent
    {
        var domainEvents = DomainEventsTestHelper.GetAllDomainEvents(aggregate).OfType<T>().ToList();
        domainEvents.Should().NotBeEmpty();
        return domainEvents;
    }

    /// <summary>
    /// Asserts that the business rule is broken.
    /// </summary>
    /// <typeparam name="TRule">The type of the business rule.</typeparam>
    /// <param name="testDelegate">The test delegate.</param>
    /// <param name="message">The message.</param>
    protected static void AssertBrokenRule<TRule>(Action testDelegate, string message)
        where TRule : class, IBusinessRule
    {
        var businessRuleValidationException = testDelegate
            .Should()
            .Throw<BusinessRuleValidationException>(message)
            .Which;
        businessRuleValidationException.BrokenRule.Should().BeOfType<TRule>();
    }

    /// <summary>
    /// Asserts that the business rule is broken.
    /// </summary>
    /// <typeparam name="TRule">The type of the business rule.</typeparam>
    /// <param name="testDelegate">The test delegate.</param>
    /// <param name="message">The message.</param>
    protected static async Task AssertBrokenRuleAsync<TRule>(Func<Task> testDelegate, string message)
        where TRule : class, IBusinessRule
    {
        var businessRuleValidationException = await testDelegate
            .Should()
            .ThrowAsync<BusinessRuleValidationException>(message);
        businessRuleValidationException.Which.BrokenRule.Should().BeOfType<TRule>();
    }
}
