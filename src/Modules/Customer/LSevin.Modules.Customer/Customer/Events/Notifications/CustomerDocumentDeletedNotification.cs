using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Customer.Consulting.Features.DeleteConsultingSelectedDocument;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;

namespace LSevin.Modules.Customer.Customer.Events.Notifications;

public sealed record CustomerDocumentDeletedNotification(CustomerDocumentDeletedDomainEvent DomainEvent)
    : DomainNotificationEventWrapper<CustomerDocumentDeletedDomainEvent>(DomainEvent);

internal sealed class CustomerDocumentDeletedNotificationHandler(ICommandBus commandBus)
    : IDomainNotificationEventHandler<CustomerDocumentDeletedNotification>
{
    public Task Handle(CustomerDocumentDeletedNotification notification, CancellationToken cancellationToken)
    {
        return commandBus.ScheduleAsync(
            new DeleteConsultingSelectedDocumentCommand(notification.DomainEvent.CustomerDocumentId),
            cancellationToken
        );
    }
}
