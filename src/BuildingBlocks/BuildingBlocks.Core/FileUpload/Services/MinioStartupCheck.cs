using Amazon.S3;
using Amazon.S3.Model;
using BuildingBlocks.Core.FileUpload.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Fails application startup when the configured object-storage backend is not actually
/// usable, instead of letting every upload fail one request at a time (or, worse, silently
/// falling back to a path that is wiped on the next container rebuild).
/// </summary>
/// <remarks>
/// Registered unconditionally (like the image backfill job) and no-ops unless
/// <see cref="FileUploadOptions.Backend"/> is <see cref="FileStorageBackend.Minio"/>. When it
/// is, it does a single bounded <c>ListObjectsV2</c> against the media bucket with the
/// credentials the API will use for real. If the bucket is missing, the credentials are
/// wrong, or MinIO is unreachable, <see cref="StartAsync"/> throws and the host exits
/// non-zero — which is what makes a misconfigured deploy loud.
/// </remarks>
internal sealed class MinioStartupCheck(
    IAmazonS3 client,
    IOptions<FileUploadOptions> options,
    ILogger<MinioStartupCheck> logger
) : IHostedService
{
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(15);

    private readonly FileUploadOptions _fileOptions = options.Value;
    private readonly S3StorageOptions _options = options.Value.S3;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (_fileOptions.Backend != FileStorageBackend.Minio)
        {
            return;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(ProbeTimeout);

        try
        {
            await client.ListObjectsV2Async(
                new ListObjectsV2Request { BucketName = _options.Bucket, MaxKeys = 1 },
                timeout.Token
            );

            logger.LogInformation(
                "Object storage reachable: bucket '{Bucket}' at '{ServiceUrl}'.",
                _options.Bucket,
                _options.ServiceUrl
            );
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException(
                $"File storage backend is 'Minio' but the media bucket '{_options.Bucket}' at "
                    + $"'{_options.ServiceUrl}' could not be reached with the configured credentials. "
                    + "The API refuses to start rather than write uploads nowhere. Check "
                    + "FileUploadOptions:S3 (ServiceUrl/Bucket/AccessKey/SecretKey), that the bucket "
                    + "exists, and that the minio-init service completed successfully.",
                ex
            );
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
