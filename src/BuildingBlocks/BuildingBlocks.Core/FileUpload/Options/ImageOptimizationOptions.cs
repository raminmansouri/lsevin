namespace BuildingBlocks.Core.FileUpload.Options;

/// <summary>
/// Options controlling automatic image optimization (resize + WebP + size budget).
/// Bound from the optional "ImageOptimizationOptions" configuration section; every
/// value has a sensible default so the section may be omitted entirely.
/// </summary>
public sealed class ImageOptimizationOptions
{
    /// <summary>Gets a value indicating whether image optimization runs on upload.</summary>
    public bool Enabled { get; init; } = true;

    /// <summary>Gets the maximum longest-edge dimension (px); larger images are scaled down.</summary>
    public int MaxDimension { get; init; } = 1920;

    /// <summary>Gets the hard output size budget in bytes.</summary>
    public long MaxBytes { get; init; } = 200 * 1024;

    /// <summary>Gets the starting (highest) encoder quality (0-100).</summary>
    public int StartQuality { get; init; } = 80;

    /// <summary>Gets the lowest encoder quality before falling back to shrinking dimensions.</summary>
    public int MinQuality { get; init; } = 40;

    /// <summary>Gets the maximum accepted input size in bytes (0 = unlimited). Larger uploads are rejected.</summary>
    public long MaxUploadBytes { get; init; } = 25 * 1024 * 1024;

    /// <summary>Gets a value indicating whether the disk backfill runs once on application startup.</summary>
    public bool RunBackfillOnStartup { get; init; }

    /// <summary>Gets the number of files processed per backfill batch before the inter-batch delay.</summary>
    public int BackfillBatchSize { get; init; } = 25;

    /// <summary>Gets the delay in milliseconds between backfill batches (throttling).</summary>
    public int BackfillBatchDelayMs { get; init; } = 250;

    /// <summary>Gets the sub-directory (under the upload root) where originals are archived before being overwritten.</summary>
    public string ArchiveDirectoryName { get; init; } = "_archive";
}
