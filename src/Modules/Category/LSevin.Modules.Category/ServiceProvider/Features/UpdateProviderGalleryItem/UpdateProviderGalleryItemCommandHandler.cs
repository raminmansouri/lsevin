using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Serialization;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderGalleryItem;

internal sealed class UpdateProviderGalleryItemCommandHandler(
    IServiceProviderRepository serviceProviderRepository,
    IFileService fileService,
    ISerializer serializer
) : CommandHandler<UpdateProviderGalleryItemCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateProviderGalleryItemCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        // Find the existing gallery item to get its current imageUrl
        var galleryItemId = ProviderGalleryItemId.Create(command.GalleryItemId);
        var existingGalleryItem = serviceProvider.GalleryItems.FirstOrDefault(g => g.Id == galleryItemId);

        if (existingGalleryItem is null)
            return AppError.NotFoundErrorMessage("Gallery item not found");

        // Determine the image URL to use
        string imageUrl = existingGalleryItem.Url;

        // If a new file is provided, upload it and use the new URL
        if (command.File is not null)
        {
            var uploadResult = await fileService.UploadSingleFileAsync(
                command.File,
                directory: $"ServiceProviders/{command.ServiceProviderId}/Gallery",
                cancellationToken
            );

            if (uploadResult.IsFailure || uploadResult.Value is { FilePaths.Count: 0 } or { TotalFileUploaded: 0 })
            {
                return AppError.ApplicationErrorMessage(SharedResource.File_Upload_Error_Message);
            }

            imageUrl = uploadResult.Value!.FilePaths!.First();
        }

        // Convert JSON strings to LocalizedString
        var titleDto = serializer.Deserialize<LocalizedContentDto>(command.Title) ?? new(new());
        var descriptionDto = serializer.Deserialize<LocalizedContentDto>(command.Description) ?? new(new());
        var title = LocalizedString.Create(titleDto.Translations);
        var description = LocalizedString.Create(descriptionDto.Translations);

        // Update the gallery item
        serviceProvider.UpdateGalleryItem(galleryItemId, title, description, imageUrl, command.DisplayOrder);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.GalleryItemId;
    }
}
