using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderService;

public sealed record RemoveProviderServiceCommand(Guid ServiceProviderId, Guid ServiceId) : Command<bool>;
