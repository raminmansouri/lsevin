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

internal sealed class UploadAnyFileCommandHandler(
    ICategoryRepository repository,
    IFileService fileService,
    ISerializer serializer
) : CommandHandler<UploadAnyFileCommand, string>
{
    public override async Task<Result<string>> Handle(
        UploadAnyFileCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        string path = "";

        switch(command.path)
        {
            case 1:
                path = "services";
                break;
            case 2:
                path = "staff";
                break;
        }


            var uploadResult = await fileService.UploadSingleFileAsync(
                command.File,
                directory: $"Categories/{path}",
                cancellationToken
            );

            if (uploadResult.IsFailure || uploadResult.Value is { FilePaths.Count: 0 } or { TotalFileUploaded: 0 })
            {
                return AppError.ApplicationErrorMessage(SharedResource.File_Upload_Error_Message);
            }

            var imageUrl = uploadResult.Value!.FilePaths!.First();
        return imageUrl;


    }
}
