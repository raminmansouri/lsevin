using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Common.HttpClients;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;

namespace LSevin.Modules.Customer.Customer.Events.Notifications;

public sealed record CustomerUpdatedNotification(CustomerUpdatedDomainEvent DomainEvent)
    : DomainNotificationEventWrapper<CustomerUpdatedDomainEvent>(DomainEvent);

public sealed class CustomerUpdatedNotificationHandler(IEventBus bus)
    : IDomainNotificationEventHandler<CustomerUpdatedNotification>
{
    public Task Handle(CustomerUpdatedNotification notification, CancellationToken cancellationToken)
    {
        return bus.PublishAsync(notification.DomainEvent, cancellationToken: cancellationToken);
    }
}

public sealed class CustomerUpdatedCacheWebhookNotificationHandler(IWebApplicationCacheApiClient cacheApiClient)
    : IDomainNotificationEventHandler<CustomerUpdatedNotification>
{
    public Task Handle(CustomerUpdatedNotification notification, CancellationToken cancellationToken)
    {
        var tagsToInvalidate = CacheKeys.Customer.GetInvalidationTags(notification.DomainEvent.CustomerId);

        return cacheApiClient.InvalidateCacheAsync(tagsToInvalidate, cancellationToken);
    }
}
