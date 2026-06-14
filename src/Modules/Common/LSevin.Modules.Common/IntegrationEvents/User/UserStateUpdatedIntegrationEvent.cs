using BuildingBlocks.Core.Messaging.EventBus;

namespace LSevin.Modules.Common.IntegrationEvents.User;

public sealed record UserStateUpdatedIntegrationEvent(Guid UserId, bool IsActive) : IntegrationEvent;
