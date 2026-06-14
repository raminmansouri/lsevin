using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;

namespace LSevin.Modules.Customer.Customer.Events.Notifications;

internal sealed record CustomerCreatedNotification(CustomerCreatedDomainEvent DomainEvent)
    : DomainNotificationEventWrapper<CustomerCreatedDomainEvent>(DomainEvent);

internal sealed class CustomerCreatedNotificationHandler(IEventBus bus)
    : IDomainNotificationEventHandler<CustomerCreatedNotification>
{
    public Task Handle(CustomerCreatedNotification notification, CancellationToken cancellationToken)
    {
        return bus.PublishAsync(notification.DomainEvent, cancellationToken: cancellationToken);
    }
}
