using Amazon.S3;
using Amazon.S3.Model;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Options;
using BuildingBlocks.Core.ResultPattern;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Stores uploads in an S3-compatible object store (MinIO in this deployment).
/// </summary>
/// <remarks>
/// The object key is the same relative path the filesystem backend would have produced,
/// so nothing in the database has to be rewritten to switch between the two.
/// <para>
/// Initializes a new instance of the <see cref="MinioFileObjectStore"/> class.
/// </para>
/// </remarks>
/// <param name="client">The S3 client.</param>
/// <param name="options">The file upload options.</param>
/// <param name="logger">The logger.</param>
internal sealed class MinioFileObjectStore(
    IAmazonS3 client,
    IOptions<FileUploadOptions> options,
    ILogger<MinioFileObjectStore> logger
) : IFileObjectStore
{
    private readonly S3StorageOptions _options = options.Value.S3;

    /// <inheritdoc />
    public async Task WriteAsync(
        string relativePath,
        byte[] content,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        var key = NormalizeKey(relativePath);

        using var stream = new MemoryStream(content, writable: false);

        var request = new PutObjectRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType,

            // The bytes are already fully buffered, so the length is known and there is
            // no reason to make the SDK probe the stream for it.
            Headers = { ContentLength = content.LongLength },
        };

        await client.PutObjectAsync(request, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Result> DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        Guard.Against.NullOrEmpty(relativePath, nameof(relativePath));

        string key;

        try
        {
            key = NormalizeKey(relativePath);
        }
        catch (ArgumentException)
        {
            // A key that tries to climb out of the prefix. There is no directory tree to
            // escape from in object storage, but rejecting it keeps a caller from being
            // able to name an object outside the media namespace.
            return Result.Error(AppError.ForbiddenError(relativePath));
        }

        try
        {
            if (!await ObjectExistsAsync(key, cancellationToken))
            {
                return Result.Error(AppError.NotFoundErrorMessage(relativePath));
            }

            await client.DeleteObjectAsync(
                new DeleteObjectRequest { BucketName = _options.Bucket, Key = key },
                cancellationToken
            );

            return Result.Success();
        }
        catch (AmazonS3Exception ex)
        {
            logger.LogError(ex, "Failed to delete object '{Key}' from bucket '{Bucket}'.", key, _options.Bucket);

            return Result.Error(AppError.ApplicationErrorMessage($"Failed to delete {relativePath}"));
        }
    }

    private async Task<bool> ObjectExistsAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            await client.GetObjectMetadataAsync(_options.Bucket, key, cancellationToken);

            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    /// <summary>
    /// Turns a stored relative path into an object key.
    /// </summary>
    /// <remarks>
    /// Backslashes are folded to forward slashes on the way in. Historically some rows
    /// were written on Windows and carry a backslash; browsers silently normalize those
    /// in a URL path but S3 does not — <c>a\b.jpg</c> and <c>a/b.jpg</c> are two different
    /// objects. Folding here means a stale value cannot quietly address nothing.
    /// </remarks>
    private static string NormalizeKey(string relativePath)
    {
        var key = relativePath.Replace('\\', '/').TrimStart('/');

        if (key.Length == 0 || key.Split('/').Any(segment => segment is ".."))
        {
            throw new ArgumentException("The path is not a valid object key.", nameof(relativePath));
        }

        return key;
    }
}
