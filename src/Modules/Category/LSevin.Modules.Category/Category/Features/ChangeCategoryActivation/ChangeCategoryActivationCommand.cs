using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryActivation;

internal sealed record ChangeCategoryActivationCommand(Guid CategoryId, bool IsActive) : Command<Guid>;
