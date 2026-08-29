using BuildingBlocks.Core.FileUpload.Options;

namespace BuildingBlocks.Core.FileUpload.Extensions;

/// <summary>
/// Startup validation that refuses a storage configuration which would silently lose uploads.
/// </summary>
/// <remarks>
/// Kept separate from <see cref="FileExtensions"/> and public so it can be unit tested without
/// standing up an application pipeline. <see cref="FileExtensions.UseFileUploadService"/> is the
/// only production caller.
/// </remarks>
public static class FileStorageBackendGuard
{
    /// <summary>
    /// Throws <see cref="InvalidOperationException"/> when the configuration would drop uploads.
    /// </summary>
    /// <param name="options">The bound file upload options.</param>
    /// <param name="isProduction">Whether the host is running in the Production environment.</param>
    /// <remarks>
    /// Two failure modes are rejected:
    /// <list type="bullet">
    /// <item><description>
    /// <see cref="FileStorageBackend.FileSystem"/> in Production — no persistent volume is wired
    /// for it any more, so writes land in the container's writable layer and are discarded on the
    /// next rebuild. Invisible until files go missing; a startup crash is deliberate.
    /// </description></item>
    /// <item><description>
    /// <see cref="FileStorageBackend.Minio"/> with a blank <c>ServiceUrl</c>, <c>Bucket</c>,
    /// <c>AccessKey</c> or <c>SecretKey</c> — every upload would 500, one request at a time.
    /// </description></item>
    /// </list>
    /// </remarks>
    public static void Validate(FileUploadOptions options, bool isProduction)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (isProduction && options.Backend == FileStorageBackend.FileSystem)
        {
            throw new InvalidOperationException(
                "FileUploadOptions:Backend is 'FileSystem' in Production. Uploads would be written to "
                    + "the container filesystem and lost on the next rebuild. Set FILE_STORAGE_BACKEND=Minio "
                    + "(and the FileUploadOptions:S3 credentials) before starting the API. See "
                    + "deployments/docker/MEDIA_STORAGE_MIGRATION.md."
            );
        }

        if (options.Backend != FileStorageBackend.Minio)
        {
            return;
        }

        var s3 = options.S3;
        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(s3.ServiceUrl))
        {
            missing.Add(nameof(s3.ServiceUrl));
        }

        if (string.IsNullOrWhiteSpace(s3.Bucket))
        {
            missing.Add(nameof(s3.Bucket));
        }

        if (string.IsNullOrWhiteSpace(s3.AccessKey))
        {
            missing.Add(nameof(s3.AccessKey));
        }

        if (string.IsNullOrWhiteSpace(s3.SecretKey))
        {
            missing.Add(nameof(s3.SecretKey));
        }

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                "FileUploadOptions:Backend is 'Minio' but these FileUploadOptions:S3 settings are blank: "
                    + string.Join(", ", missing)
                    + ". Fill them in (the minio-init service creates the scoped API account from "
                    + "MINIO_API_ACCESS_KEY / MINIO_API_SECRET_KEY) before starting the API."
            );
        }
    }
}
