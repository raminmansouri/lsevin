using BuildingBlocks.Core.Messaging.EventBus;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents a mapper that maps domain events to integration events.
/// </summary>
/// <example>
/// <code><![CDATA[
/// public sealed class EventMapper : IEventMapper
/// {
///     public IEnumerable<IIntegrationEvent> MapAll(IEnumerable<IDomainEvent> events) => events.Select(Map);
///
///     public IIntegrationEvent? Map(IDomainEvent @event)
///     {
///         return @event switch
///         {
///             XDomainEvent e => new XIntegrationEven(e...),
///             YDomainEvent e => new YIntegrationEven(e...),
///             _ => null
///         };
///     }
/// }
/// ]]></code>
/// </example>
public interface IEventMapper
{
    /// <summary>
    /// Maps the specified domain event to an integration event.
    /// </summary>
    /// <param name="event">The domain event.</param>
    /// <returns>The integration event.</returns>
    IIntegrationEvent? Map(IDomainEvent @event);

    /// <summary>
    /// Maps all specified domain events to integration events.
    /// </summary>
    /// <param name="events">The domain events.</param>
    /// <returns>The collection of integration events.</returns>
    IEnumerable<IIntegrationEvent?> MapAll(IEnumerable<IDomainEvent> events);
}
