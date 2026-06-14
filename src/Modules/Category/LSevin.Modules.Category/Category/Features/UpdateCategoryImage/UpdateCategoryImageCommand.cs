using BuildingBlocks.Core.Messaging.Commands;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

public sealed record UpdateCategoryImageCommand(
    Guid CateogryId,
    IFormFile? File // Optional - only if changing image
) : Command<Guid>;
