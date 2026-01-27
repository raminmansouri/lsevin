namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the in-memory event bus.
/// </summary>
internal sealed class InMemoryEventBus
{
    /// <summary>
    /// Initializes static members of the <see cref="InMemoryEventBus"/> class.
    /// </summary>
    static InMemoryEventBus() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="InMemoryEventBus"/> class.
    /// </summary>
    private InMemoryEventBus()
    {
        _handlersDictionary = new Dictionary<string, List<IIntegrationEventHandler>>(StringComparer.Ordinal);
    }

    /// <summary>
    /// Gets the instance of the <see cref="InMemoryEventBus"/> class.
    /// </summary>
    public static InMemoryEventBus Instance { get; } = new();

    /// <summary>
    /// The handlers' dictionary.
    /// </summary>
    private readonly Dictionary<string, List<IIntegrationEventHandler>> _handlersDictionary;

    /// <summary>
    /// Subscribe to the integration event.
    /// </summary>
    /// <param name="handler">The integration event handler.</param>
    /// <typeparam name="T">The type of the integration event to subscribe to.</typeparam>
    public void Subscribe<T>(IIntegrationEventHandler<T> handler)
        where T : IIntegrationEvent
    {
        var eventType = typeof(T).FullName;
        if (eventType != null)
        {
            if (_handlersDictionary.TryGetValue(eventType, out List<IIntegrationEventHandler>? handlers))
            {
                handlers.Add(handler);
            }
            else
            {
                _handlersDictionary.Add(eventType, [handler]);
            }
        }
    }

    /// <summary>
    /// Publish the integration event.
    /// </summary>
    /// <param name="event">The integration event to publish.</param>
    /// <param name="cancellationToken">The cancellation token for the operation.</param>
    /// <typeparam name="T">The type of the integration event to publish.</typeparam>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default)
        where T : IIntegrationEvent
    {
        var eventType = @event.GetType().FullName;

        if (eventType == null)
        {
            return;
        }

        if (!_handlersDictionary.TryGetValue(eventType, out var integrationEventHandlers))
        {
            return;
        }

        foreach (var integrationEventHandler in integrationEventHandlers)
        {
            if (integrationEventHandler is IIntegrationEventHandler<T> handler)
            {
                await handler.Handle(@event, cancellationToken);
            }
        }
    }
}
