using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;

namespace LSevin.Modules.Identity.Infrastructure.Mappers;

internal sealed class EventMappers : IEventMapper
{
    public IEnumerable<IIntegrationEvent?> MapAll(IEnumerable<IDomainEvent> events) => events.Select(Map);

    public IIntegrationEvent? Map(IDomainEvent @event)
    {
        return @event switch
        {
            _ => null,
        };
    }
}
