using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Common.IntegrationEvents.Customer;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;

namespace LSevin.Modules.Customer.Infrastructure.Mappers;

internal sealed class EventMapper : IEventMapper
{
    public IEnumerable<IIntegrationEvent?> MapAll(IEnumerable<IDomainEvent> events) => events.Select(Map);

    public IIntegrationEvent? Map(IDomainEvent @event)
    {
        return @event switch
        {
            CustomerCreatedDomainEvent e => new CustomerCreatedIntegrationEvent(
                e.CustomerId,
                e.FirstName,
                e.LastName,
                e.PhoneNumber.Value,
                e.PhoneNumber.CountryCode,
                e.Email
            ),
            CustomerUpdatedDomainEvent e => new CustomerUpdatedIntegrationEvent(
                e.CustomerId,
                e.FirstName,
                e.LastName,
                e.PhoneNumber.Value,
                e.PhoneNumber.CountryCode,
                e.Email
            ),
            _ => null,
        };
    }
}
