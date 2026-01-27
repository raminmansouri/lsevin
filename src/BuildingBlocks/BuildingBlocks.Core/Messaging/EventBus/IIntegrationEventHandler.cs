using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the integration event handler.
/// </summary>
/// <typeparam name="TIntegrationEvent">The type of the integration event.</typeparam>
public interface IIntegrationEventHandler<in TIntegrationEvent> : IIntegrationEventHandler
    where TIntegrationEvent : IIntegrationEvent;

/// <summary>
/// Represents the integration event handler.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="IIntegrationEventHandler"/> class.
/// </remarks>
public interface IIntegrationEventHandler : IEventHandler<IIntegrationEvent>;
