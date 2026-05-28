namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

public sealed record GetUploadFilesRequest(
    
    Guid? providerId,
    Guid serviceId,
    Guid? specialistId,
    bool? IsActive);
