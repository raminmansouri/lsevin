using MediatR;
using Polly;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the event bus.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="EventPublisher"/> class.
/// </remarks>
/// <param name="mediator">The mediator.</param>
internal sealed class EventPublisher(IPublisher mediator) : IEventPublisher
{
    /// <inheritdoc />
    public Task PublishAsync(object @event, CancellationToken cancellationToken = default)
    {
        var retryAsync = Policy.Handle<Exception>().RetryAsync(2);

        return retryAsync.ExecuteAsync(
            async c => await mediator.Publish(@event, c).ConfigureAwait(false),
            cancellationToken
        );
    }

    /// <inheritdoc />
    public async Task PublishAsync<T>(IEnumerable<T> eventsData, CancellationToken cancellationToken = default)
        where T : class, IDomainEvent
    {
        foreach (var eventData in eventsData)
        {
            await PublishAsync(eventData, cancellationToken).ConfigureAwait(false);
        }
    }
}
