using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.Specifications;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryParent;

internal sealed class ChangeCategoryParentCommandHandler(ICategoryRepository repository)
    : CommandHandler<ChangeCategoryParentCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        ChangeCategoryParentCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new CategoryWithChildrenSpec(command.CategoryId);
        var category = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (category is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);

        CategoryId? parentId = command.ParentId.HasValue ? CategoryId.Create(command.ParentId.Value) : null;

        if (parentId is not null && parentId != category.ParentId)
        {
            var parentSpec = new CategoryByIdSpec(parentId.Value);
            var parentExists = await repository.AnyAsync(parentSpec, cancellationToken);

            if (!parentExists)
                return AppError.NotFoundErrorMessage(CategoryResource.Category);
        }

        category.ChangeParent(parentId);

        repository.Update(category);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return category.Id.Value;
    }
}
