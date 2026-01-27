using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.Specifications;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed class UpdateCategoryCommandHandler(ICategoryRepository repository)
    : CommandHandler<UpdateCategoryCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        var categoryId = CategoryId.Create(command.CateogryId);
        var spec = new CategoryByIdSpec(categoryId);
        var category = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (category is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        category.Update(
            name: name,
            description: description,
            displayOrder: command.DisplayOrder ?? 1,
            isActive: true, // command.IsActive,
            iconUrl: command.IconUrl
        );

        repository.Update(category);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return category.Id.Value;
    }
}
