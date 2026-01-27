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
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderGalleryItem;

internal sealed class AddProviderGalleryItemCommandHandler(
    IServiceProviderRepository serviceProviderRepository,
    IFileService fileService,
    ISerializer serializer
) : CommandHandler<AddProviderGalleryItemCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderGalleryItemCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        // Upload the gallery image
        var uploadResult = await fileService.UploadSingleFileAsync(
            command.File,
            directory: $"ServiceProviders/{command.ServiceProviderId}/Gallery",
            cancellationToken
        );

        if (uploadResult.IsFailure || uploadResult.Value is { FilePaths.Count: 0 } or { TotalFileUploaded: 0 })
        {
            return AppError.ApplicationErrorMessage(SharedResource.File_Upload_Error_Message);
        }

        // Convert LocalizedContentDto JSON string to LocalizedString
        var titleDto = serializer.Deserialize<LocalizedContentDto>(command.Title) ?? new(new());
        var descriptionDto = serializer.Deserialize<LocalizedContentDto>(command.Description) ?? new(new());
        var titleTranslations = titleDto.Translations;
        var descriptionTranslations = descriptionDto.Translations;
        var title = LocalizedString.Create(titleTranslations);
        var description = LocalizedString.Create(descriptionTranslations);

        // Create gallery item for each uploaded file
        foreach (var filePath in uploadResult.Value!.FilePaths!)
        {
            var galleryItem = ProviderGalleryItem.Create(title, description, filePath, command.File.ContentType);

            serviceProvider.AddGalleryItem(galleryItem);
        }

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceProvider.GalleryItems.Last().Id.Value;
    }
}
