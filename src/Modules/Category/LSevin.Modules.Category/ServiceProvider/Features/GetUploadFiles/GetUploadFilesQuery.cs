using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

internal sealed record GetUploadFilesQuery(Guid ServiceId, bool? IsActive)
    : Query<GetUploadFilesResponse>
{
    public static GetUploadFilesQuery Of(Guid ServiceId, bool? isActive = null) =>
        new(ServiceId, isActive);
}
