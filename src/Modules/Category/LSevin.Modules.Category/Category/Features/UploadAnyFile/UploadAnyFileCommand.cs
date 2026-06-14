using BuildingBlocks.Core.Messaging.Commands;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

public sealed record UploadAnyFileCommand(
    int path,
    IFormFile? File 
) : Command<string>;
