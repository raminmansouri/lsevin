using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.ChangeServiceProviderActivation;

internal sealed record ChangeServiceProviderActivationCommand(Guid ServiceProviderId, bool IsActive) : Command<Guid>;
