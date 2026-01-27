using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Features.CreateCategory;

internal sealed class CreateCategoryCommandHandler(ICategoryRepository repository)
    : CommandHandler<CreateCategoryCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        CategoryId? parentId = command.ParentId.HasValue ? CategoryId.Create(command.ParentId.Value) : null;

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var category = CategoryDomain.Create(
            name: name,
            description: description,
            parentId: parentId,
            displayOrder: command.DisplayOrder ?? 1,
            isActive: true, // command.IsActive,
            iconUrl: command.IconUrl
        );

        await repository.CreateAsync(category, cancellationToken);

        return category.Id.Value;
    }
}
