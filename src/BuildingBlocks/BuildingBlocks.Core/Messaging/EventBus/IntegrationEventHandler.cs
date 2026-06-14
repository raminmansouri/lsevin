namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the integration event handler.
/// </summary>
/// <typeparam name="TIntegrationEvent">The type of the integration event.</typeparam>
public abstract class IntegrationEventHandler<TIntegrationEvent> : IIntegrationEventHandler<TIntegrationEvent>
    where TIntegrationEvent : IIntegrationEvent
{
    /// <summary>
    /// Handles the specified integration event.
    /// </summary>
    /// <param name="integrationEvent">The integration event.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public abstract Task Handle(TIntegrationEvent integrationEvent, CancellationToken cancellationToken = default);

    /// <inheritdoc />
    public Task Handle(IIntegrationEvent integrationEvent, CancellationToken cancellationToken) =>
        Handle((TIntegrationEvent)integrationEvent, cancellationToken);
}
