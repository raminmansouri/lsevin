using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;
using LSevin.Modules.Customer.Customer.Events.Notifications;

namespace LSevin.Modules.Customer.Infrastructure.Mappers;

internal sealed class EventRegistry(IDomainNotificationRegistry registry) : IEventRegistry
{
    public void RegisterEvents()
    {
        registry.Register<CustomerCreatedDomainEvent, CustomerCreatedNotification>();
        registry.Register<CustomerUpdatedDomainEvent, CustomerUpdatedNotification>();
    }
}
