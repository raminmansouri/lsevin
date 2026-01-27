using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.DeleteServiceProvider;

internal sealed record DeleteServiceProviderCommand(Guid ServiceProviderId) : Command<Guid>;
