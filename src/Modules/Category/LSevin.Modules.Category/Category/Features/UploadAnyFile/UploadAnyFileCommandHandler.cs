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
using BuildingBlocks.Security.Common;
using BuildingBlocks.Security.Jwt.Services;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

internal sealed class UploadAnyFileCommandHandler(
    ICategoryRepository repository,
    IFileService fileService,
    ISerializer serializer,
    IUserAccessor userAccessor,
    IHttpContextAccessor httpContextAccessor
) : CommandHandler<UploadAnyFileCommand, string>
{
    public override async Task<Result<string>> Handle(
        UploadAnyFileCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var userId = userAccessor.GetUserIdentity;
        if (userId == Guid.Empty)
            return AppError.ApplicationErrorMessage("An authenticated user is required to upload files.");

        var principal = httpContextAccessor.HttpContext?.User;
        var isAdmin = principal?.IsInRole(SecurityConstants.Role.Admin) == true
            || principal?.IsInRole(SecurityConstants.Role.SuperAdmin) == true;
        // Never trust the caller's `path` for a non-admin: otherwise a customer
        // could write into publicly served Categories/* or ServiceProviders/*.
        string path = isAdmin ? "" : $"CustomerDocument/{userId:D}";

        if (isAdmin) switch(command.path)
        {
            case 1:
                path = "services";
                break;
            case 2:
                path = "staff";
                break;
            case 3:
                path = "CustomerDocument/AdminUploads";
                break;
        }


            var uploadResult = await fileService.UploadSingleFileAsync(
                command.File,
                directory: isAdmin && command.path != 3 ? $"Categories/{path}" : path,
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
