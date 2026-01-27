using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryParent;

internal sealed record ChangeCategoryParentCommand(Guid CategoryId, Guid? ParentId) : Command<Guid>;
