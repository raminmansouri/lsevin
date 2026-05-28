using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderGalleryItem;

internal sealed class RemoveProviderGalleryItemCommandHandler(
    IServiceProviderRepository serviceProviderRepository,
    IFileService fileService
) : CommandHandler<RemoveProviderGalleryItemCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RemoveProviderGalleryItemCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        var galleryItemId = ProviderGalleryItemId.Create(command.GalleryItemId);
        var galleryItem = serviceProvider.GalleryItems.FirstOrDefault(g => g.Id == galleryItemId);

        if (galleryItem is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider_Gallery);
        }

        // Delete the physical file
        var deleteResult = fileService.DeleteFile(galleryItem.Url);
        if (deleteResult.IsFailure)
        {
            //return AppError.ApplicationErrorMessage(CategoryResource.Service_Provider_Gallery);
        }

        // Remove the gallery item from the service provider
        serviceProvider.RemoveGalleryItem(galleryItemId);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
