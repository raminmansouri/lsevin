using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderAttribute;

public sealed record RemoveProviderAttributeCommand(Guid ServiceProviderId, Guid AttributeId) : Command<bool>;
