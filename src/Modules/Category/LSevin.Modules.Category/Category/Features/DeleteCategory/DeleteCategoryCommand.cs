using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.DeleteCategory;

internal sealed record DeleteCategoryCommand(Guid CategoryId) : Command<Guid>;
