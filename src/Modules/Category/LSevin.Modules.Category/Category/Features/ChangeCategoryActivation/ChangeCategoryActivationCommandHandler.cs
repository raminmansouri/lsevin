using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.Specifications;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryActivation;

internal sealed class ChangeCategoryActivationCommandHandler(ICategoryRepository repository)
    : CommandHandler<ChangeCategoryActivationCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        ChangeCategoryActivationCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var categoryId = CategoryId.Create(command.CategoryId);
        var spec = new CategoryByIdSpec(categoryId);
        var category = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (category is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);

        category.ChangeActivation(command.IsActive);

        repository.Update(category);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return category.Id.Value;
    }
}
