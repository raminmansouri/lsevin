using BuildingBlocks.Core.FileUpload.Options;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>The outcome of a backfill pass.</summary>
/// <param name="Processed">Images that were (re)optimized and overwritten.</param>
/// <param name="SkippedAlreadyOptimized">Images already within budget/dimension (idempotent skip).</param>
/// <param name="Failed">Images that errored (logged and left untouched).</param>
public sealed record BackfillSummary(int Processed, int SkippedAlreadyOptimized, int Failed);

/// <summary>
/// One-time, repeatable backfill that optimizes existing image files on disk.
///
/// Design notes:
///  - <b>Link-safe:</b> it re-encodes each file <i>in its own format</i> (jpg→jpg,
///    png→png, webp→webp) so the on-disk path/extension never changes and the
///    ad-hoc DB references (there is no central media table) stay valid. New
///    uploads are converted to WebP by <see cref="FileService"/>; converting
///    <i>existing</i> non-WebP files to WebP additionally requires updating their
///    DB column, which a pure disk scan can't do safely — see IMAGE_OPTIMIZATION.md.
///  - <b>Safe:</b> originals are copied to the archive directory before being
///    overwritten; a file is never replaced by a larger one.
///  - <b>Resumable / idempotent:</b> a file already within the size budget and max
///    dimension is skipped, so a crash-and-rerun continues cleanly and a second
///    full run processes zero files.
///  - <b>Throttled:</b> processes in batches with a delay to keep CPU/memory sane.
/// </summary>
public sealed class ImageBackfillRunner(
    IImageOptimizer imageOptimizer,
    IOptions<FileUploadOptions> fileOptions,
    IOptions<ImageOptimizationOptions> imageOptions,
    IWebHostEnvironment environment,
    ILogger<ImageBackfillRunner> logger
)
{
    private static readonly HashSet<string> BackfillableExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    };

    private readonly FileUploadOptions _fileOptions = fileOptions.Value;
    private readonly ImageOptimizationOptions _imageOptions = imageOptions.Value;

    /// <summary>Runs the backfill over the upload directory.</summary>
    public async Task<BackfillSummary> RunAsync(CancellationToken cancellationToken = default)
    {
        var root = Path.Combine(environment.ContentRootPath, _fileOptions.UploadDirectory);

        if (!Directory.Exists(root))
        {
            logger.LogWarning("Image backfill: upload directory '{Root}' does not exist; nothing to do.", root);
            return new BackfillSummary(0, 0, 0);
        }

        var archiveRoot = Path.Combine(root, _imageOptions.ArchiveDirectoryName);

        var files = Directory
            .EnumerateFiles(root, "*", SearchOption.AllDirectories)
            .Where(path => !path.StartsWith(archiveRoot, StringComparison.OrdinalIgnoreCase))
            .Where(path => BackfillableExtensions.Contains(Path.GetExtension(path)))
            .ToList();

        logger.LogInformation("Image backfill: starting over {Count} candidate file(s) in '{Root}'.", files.Count, root);

        int processed = 0,
            skipped = 0,
            failed = 0,
            inBatch = 0;

        foreach (var path in files)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                var result = await ProcessFileAsync(path, root, archiveRoot, cancellationToken);
                if (result)
                {
                    processed++;
                }
                else
                {
                    skipped++;
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                failed++;
                logger.LogError(ex, "Image backfill: failed to optimize '{Path}'; left untouched.", path);
            }

            if (++inBatch >= Math.Max(1, _imageOptions.BackfillBatchSize))
            {
                inBatch = 0;
                logger.LogInformation(
                    "Image backfill progress: {Processed} processed / {Skipped} skipped / {Failed} failed.",
                    processed,
                    skipped,
                    failed
                );

                if (_imageOptions.BackfillBatchDelayMs > 0)
                {
                    await Task.Delay(_imageOptions.BackfillBatchDelayMs, cancellationToken);
                }
            }
        }

        logger.LogInformation(
            "Image backfill complete: {Processed} processed / {Skipped} skipped / {Failed} failed.",
            processed,
            skipped,
            failed
        );

        return new BackfillSummary(processed, skipped, failed);
    }

    /// <returns><c>true</c> if the file was optimized and overwritten; <c>false</c> if skipped.</returns>
    private async Task<bool> ProcessFileAsync(
        string path,
        string root,
        string archiveRoot,
        CancellationToken cancellationToken
    )
    {
        var original = await File.ReadAllBytesAsync(path, cancellationToken);

        using (var inspectStream = new MemoryStream(original, writable: false))
        {
            var inspect = await imageOptimizer.InspectAsync(inspectStream, cancellationToken);

            // Not decodable, or already within budget + dimension → idempotent skip.
            if (
                !inspect.IsImage
                || (
                    inspect.Bytes <= _imageOptions.MaxBytes
                    && Math.Max(inspect.Width, inspect.Height) <= _imageOptions.MaxDimension
                )
            )
            {
                return false;
            }
        }

        var format = FormatFor(Path.GetExtension(path));
        ImageOptimizationResult optimized;
        using (var encodeStream = new MemoryStream(original, writable: false))
        {
            optimized = await imageOptimizer.OptimizeAsync(encodeStream, format, cancellationToken);
        }

        // Never replace a file with a larger one.
        if (optimized.Bytes.LongLength >= original.LongLength)
        {
            return false;
        }

        ArchiveOriginal(root, archiveRoot, path);
        await File.WriteAllBytesAsync(path, optimized.Bytes, cancellationToken);
        return true;
    }

    private static ImageOutputFormat FormatFor(string extension) =>
        extension.ToLowerInvariant() switch
        {
            ".png" => ImageOutputFormat.Png,
            ".webp" => ImageOutputFormat.Webp,
            _ => ImageOutputFormat.Jpeg,
        };

    private static void ArchiveOriginal(string root, string archiveRoot, string path)
    {
        var relative = Path.GetRelativePath(root, path);
        var archivePath = Path.Combine(archiveRoot, relative);

        var archiveDir = Path.GetDirectoryName(archivePath);
        if (!string.IsNullOrEmpty(archiveDir))
        {
            Directory.CreateDirectory(archiveDir);
        }

        // Keep the first archived copy as the canonical original; don't overwrite it on re-runs.
        if (!File.Exists(archivePath))
        {
            File.Copy(path, archivePath);
        }
    }
}
