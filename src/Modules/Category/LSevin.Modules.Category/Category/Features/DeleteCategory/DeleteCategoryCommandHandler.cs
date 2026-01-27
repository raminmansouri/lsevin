using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.Specifications;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.DeleteCategory;

internal sealed class DeleteCategoryCommandHandler(ICategoryRepository repository)
    : CommandHandler<DeleteCategoryCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        var categoryId = CategoryId.Create(command.CategoryId);
        var spec = new CategoryWithChildrenSpec(categoryId);
        var category = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (category is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);

        category.DeleteApproval();

        repository.Delete(category);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return category.Id.Value;
    }
}
