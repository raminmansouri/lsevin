using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Serialization;
using LSevin.Modules.Category.Category.Data.Repository;
using LSevin.Modules.Category.Category.Specifications;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

internal sealed class UpdateCategoryImageCommandHandler(
    ICategoryRepository repository,
    IFileService fileService,
    ISerializer serializer
) : CommandHandler<UpdateCategoryImageCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateCategoryImageCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var categoryId = CategoryId.Create(command.CateogryId);
        var spec = new CategoryByIdSpec(categoryId);
        var category = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (category is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);



        string imageUrl = category?.ImageUrl;

        // If a new file is provided, upload it and use the new URL
        if (command.File is not null)
        {
            var uploadResult = await fileService.UploadSingleFileAsync(
                command.File,
                directory: $"Categories/{command.CateogryId}/Gallery",
                cancellationToken
            );

            if (uploadResult.IsFailure || uploadResult.Value is { FilePaths.Count: 0 } or { TotalFileUploaded: 0 })
            {
                return AppError.ApplicationErrorMessage(SharedResource.File_Upload_Error_Message);
            }

            imageUrl = uploadResult.Value!.FilePaths!.First();
        }

        category.Update(
            name: category.Name,
            description: category.Description,
            displayOrder: category.DisplayOrder,
            isActive: true, // command.IsActive,
            iconUrl: category.IconUrl,
            imageUrl: imageUrl
        );

        repository.Update(category);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return category.Id.Value;
    }
}
