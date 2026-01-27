using MediatR;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the event handler.
/// </summary>
/// <typeparam name="TEvent">The type of the event.</typeparam>
public interface IEventHandler<in TEvent> : INotificationHandler<TEvent>
    where TEvent : INotification;
