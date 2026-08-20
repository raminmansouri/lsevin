namespace BuildingBlocks.Core.FileUpload.Options;

/// <summary>
/// Identifies where uploaded bytes are stored.
/// </summary>
public enum FileStorageBackend
{
    /// <summary>The upload directory on the local filesystem. The historical default.</summary>
    FileSystem,

    /// <summary>An S3-compatible object store (MinIO in this deployment).</summary>
    Minio,
}

/// <summary>
/// Represents the file upload options.
/// </summary>
public sealed class FileUploadOptions
{
    /// <summary>
    /// Gets the upload directory.
    /// </summary>
    public required string UploadDirectory { get; init; }

    /// <summary>
    /// Gets the allowed file extensions.
    /// </summary>
    public string[] AllowedFileExtensions { get; init; } = [];

    /// <summary>
    /// Gets the storage backend for uploaded bytes.
    /// </summary>
    /// <remarks>
    /// Defaults to <see cref="FileStorageBackend.FileSystem"/> so an existing deployment
    /// that says nothing about this keeps behaving exactly as it did. Flipping it to
    /// <see cref="FileStorageBackend.Minio"/> — and back — is a configuration change and
    /// a restart, which is what keeps the migration reversible while the disk files
    /// are still in place.
    /// </remarks>
    public FileStorageBackend Backend { get; init; } = FileStorageBackend.FileSystem;

    /// <summary>
    /// Gets the S3 / MinIO connection settings. Only read when <see cref="Backend"/>
    /// is <see cref="FileStorageBackend.Minio"/>.
    /// </summary>
    /// <remarks>
    /// Deliberately not <c>required</c>: <c>AddValidatedOptions</c> validates required
    /// members at startup, and a filesystem deployment must not be forced to configure
    /// an object store it never talks to.
    /// </remarks>
    public S3StorageOptions S3 { get; init; } = new();
}

/// <summary>
/// Connection settings for an S3-compatible object store.
/// </summary>
public sealed class S3StorageOptions
{
    /// <summary>Gets the service endpoint, for example <c>http://minio:9000</c>.</summary>
    public string ServiceUrl { get; init; } = string.Empty;

    /// <summary>Gets the bucket that holds uploaded media.</summary>
    public string Bucket { get; init; } = string.Empty;

    /// <summary>Gets the access key.</summary>
    public string AccessKey { get; init; } = string.Empty;

    /// <summary>Gets the secret key.</summary>
    public string SecretKey { get; init; } = string.Empty;

    /// <summary>
    /// Gets the region used for request signing. MinIO does not care which region
    /// this is, but SigV4 requires <em>a</em> value and it must match between the
    /// writer and anything that later signs URLs for the same objects.
    /// </summary>
    public string Region { get; init; } = "us-east-1";

    /// <summary>
    /// Gets a value indicating whether to address objects as
    /// <c>host/bucket/key</c> rather than <c>bucket.host/key</c>.
    /// </summary>
    /// <remarks>
    /// True for MinIO: virtual-host addressing needs wildcard DNS per bucket, which
    /// a single-node deployment behind a fixed hostname does not have.
    /// </remarks>
    public bool ForcePathStyle { get; init; } = true;
}
