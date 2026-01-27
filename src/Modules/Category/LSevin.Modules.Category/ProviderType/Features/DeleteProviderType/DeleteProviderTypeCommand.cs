using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.DeleteProviderType;

internal sealed record DeleteProviderTypeCommand(Guid ProviderTypeId) : Command<Guid>;
