using BuildingBlocks.Core.Messaging.Events;

namespace LSevin.Modules.Category.Infrastructure.Mappers;

internal sealed class EventRegistry(
// IDomainNotificationRegistry registry
) : IEventRegistry
{
    public void RegisterEvents() { }
}
