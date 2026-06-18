namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// The encoded output format for an optimization pass.
/// </summary>
public enum ImageOutputFormat
{
    /// <summary>WebP (default for new uploads).</summary>
    Webp,

    /// <summary>JPEG (used by the backfill to keep an existing .jpg path link-safe).</summary>
    Jpeg,

    /// <summary>PNG (used by the backfill to keep an existing .png path link-safe).</summary>
    Png,
}

/// <summary>The result of inspecting a candidate image without fully re-encoding it.</summary>
/// <param name="IsImage">Whether the bytes decoded as a supported raster image.</param>
/// <param name="IsWebp">Whether the source format is WebP.</param>
/// <param name="Width">Decoded width in px (0 if not an image).</param>
/// <param name="Height">Decoded height in px (0 if not an image).</param>
/// <param name="Bytes">The source byte length.</param>
public sealed record ImageInspectResult(bool IsImage, bool IsWebp, int Width, int Height, long Bytes);

/// <summary>The result of an optimization pass.</summary>
/// <param name="Bytes">The optimized, encoded bytes.</param>
/// <param name="Width">The final width in px.</param>
/// <param name="Height">The final height in px.</param>
public sealed record ImageOptimizationResult(byte[] Bytes, int Width, int Height);

/// <summary>
/// Optimizes raster images: resizes to a max dimension, strips metadata, and encodes
/// under a size budget. Implementations must never throw on non-image input — callers
/// rely on <see cref="InspectAsync"/> reporting <c>IsImage = false</c> to pass through.
/// </summary>
public interface IImageOptimizer
{
    /// <summary>Returns true if the extension is a raster format this optimizer can process.</summary>
    bool IsOptimizableExtension(string fileNameOrExtension);

    /// <summary>Cheaply inspects format/dimensions/size without a full re-encode. Never throws.</summary>
    Task<ImageInspectResult> InspectAsync(Stream image, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resizes (if needed), strips metadata, and encodes to <paramref name="outputFormat"/>,
    /// lowering quality then dimensions until within the configured size budget.
    /// </summary>
    Task<ImageOptimizationResult> OptimizeAsync(
        Stream image,
        ImageOutputFormat outputFormat,
        CancellationToken cancellationToken = default
    );
}
