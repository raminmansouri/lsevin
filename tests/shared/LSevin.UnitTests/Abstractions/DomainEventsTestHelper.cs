using System.Collections;
using System.Reflection;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;

namespace LSevin.UnitTests.Abstractions;

/// <summary>
/// Helper class for testing domain events.
/// </summary>
public static class DomainEventsTestHelper
{
    /// <summary>
    /// Gets all domain events for the specified aggregate.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <returns>A list of domain events.</returns>
    public static IList<IDomainEvent> GetAllDomainEvents(IAggregateRoot aggregate)
    {
        List<IDomainEvent> domainEvents = [];

        domainEvents.AddRange(aggregate.DomainEvents);

        var fields = aggregate
            .GetType()
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public)
            .Concat(
                aggregate
                    .GetType()
                    .BaseType?.GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public)
                ?? []
            )
            .ToArray();

        foreach (var field in fields)
        {
            var isEntity = typeof(Entity).IsAssignableFrom(field.FieldType);

            if (isEntity)
            {
                domainEvents.AddRange(
                    field.GetValue(aggregate) is not IAggregateRoot entity ? [] : [.. GetAllDomainEvents(entity)]
                );
            }

            if (field.FieldType != typeof(string) && typeof(IEnumerable).IsAssignableFrom(field.FieldType))
            {
                if (field.GetValue(aggregate) is IEnumerable enumerable)
                {
                    foreach (var en in enumerable)
                    {
                        if (en is IAggregateRoot entityItem)
                        {
                            domainEvents.AddRange(GetAllDomainEvents(entityItem));
                        }
                    }
                }
            }
        }

        return domainEvents;
    }

    /// <summary>
    /// Clears all domain events for the specified aggregate.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    public static void ClearAllDomainEvents(IAggregateRoot aggregate)
    {
        aggregate.ClearDomainEvents();

        var fields = aggregate
            .GetType()
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public)
            .Concat(
                aggregate
                    .GetType()
                    .BaseType?.GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public)
                ?? []
            )
            .ToArray();

        foreach (var field in fields)
        {
            var isEntity = field.FieldType.IsAssignableFrom(typeof(Entity));

            if (isEntity)
            {
                if (field.GetValue(aggregate) is IAggregateRoot entity)
                {
                    ClearAllDomainEvents(entity);
                }
            }

            if (field.FieldType != typeof(string) && typeof(IEnumerable).IsAssignableFrom(field.FieldType))
            {
                if (field.GetValue(aggregate) is IEnumerable enumerable)
                {
                    foreach (var en in enumerable)
                    {
                        if (en is IAggregateRoot entityItem)
                        {
                            ClearAllDomainEvents(entityItem);
                        }
                    }
                }
            }
        }
    }
}
