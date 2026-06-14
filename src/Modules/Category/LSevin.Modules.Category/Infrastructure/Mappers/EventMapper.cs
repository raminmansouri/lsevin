using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;

namespace LSevin.Modules.Category.Infrastructure.Mappers;

internal sealed class EventMapper : IEventMapper
{
    public IEnumerable<IIntegrationEvent?> MapAll(IEnumerable<IDomainEvent> events) => events.Select(Map);

    public IIntegrationEvent? Map(IDomainEvent @event)
    {
        return null;
    }
}
