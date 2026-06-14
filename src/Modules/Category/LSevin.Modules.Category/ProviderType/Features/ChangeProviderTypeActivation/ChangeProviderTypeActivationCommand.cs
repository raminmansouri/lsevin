using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.ChangeProviderTypeActivation;

internal sealed record ChangeProviderTypeActivationCommand(Guid ProviderTypeId, bool IsActive) : Command<Guid>;
