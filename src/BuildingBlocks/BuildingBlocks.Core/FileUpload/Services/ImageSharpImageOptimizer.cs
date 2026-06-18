using BuildingBlocks.Core.FileUpload.Options;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// <see cref="IImageOptimizer"/> backed by SixLabors.ImageSharp.
/// </summary>
/// <remarks>
/// ⚠️ ImageSharp uses the Six Labors Split License — free for OSS, a paid license
/// may be required for closed-source commercial use. To avoid that, implement this
/// same interface with Magick.NET or SkiaSharp; nothing else in the pipeline changes.
/// </remarks>
internal sealed class ImageSharpImageOptimizer(IOptions<ImageOptimizationOptions> options)
    : IImageOptimizer
{
    private static readonly HashSet<string> OptimizableExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".tif",
        ".tiff",
    };

    private readonly ImageOptimizationOptions _options = options.Value;

    /// <inheritdoc />
    public bool IsOptimizableExtension(string fileNameOrExtension)
    {
        if (string.IsNullOrWhiteSpace(fileNameOrExtension))
        {
            return false;
        }

        var extension = fileNameOrExtension.StartsWith('.')
            ? fileNameOrExtension
            : Path.GetExtension(fileNameOrExtension);

        return !string.IsNullOrEmpty(extension) && OptimizableExtensions.Contains(extension);
    }

    /// <inheritdoc />
    public async Task<ImageInspectResult> InspectAsync(Stream image, CancellationToken cancellationToken = default)
    {
        try
        {
            var length = image.CanSeek ? image.Length : 0;

            if (image.CanSeek)
            {
                image.Position = 0;
            }

            var format = await Image.DetectFormatAsync(image, cancellationToken);

            if (image.CanSeek)
            {
                image.Position = 0;
            }

            var info = await Image.IdentifyAsync(image, cancellationToken);

            var isWebp = format is not null
                && string.Equals(format.Name, "WEBP", StringComparison.OrdinalIgnoreCase);

            return new ImageInspectResult(true, isWebp, info.Width, info.Height, length);
        }
        catch
        {
            // Not a decodable image (or a format ImageSharp can't read) — let the
            // caller store/skip it untouched.
            return new ImageInspectResult(false, false, 0, 0, 0);
        }
    }

    /// <inheritdoc />
    public async Task<ImageOptimizationResult> OptimizeAsync(
        Stream image,
        ImageOutputFormat outputFormat,
        CancellationToken cancellationToken = default
    )
    {
        if (image.CanSeek)
        {
            image.Position = 0;
        }

        using var img = await Image.LoadAsync(image, cancellationToken);

        // Strip EXIF/IPTC/XMP metadata.
        img.Metadata.ExifProfile = null;
        img.Metadata.IptcProfile = null;
        img.Metadata.XmpProfile = null;

        // 1) Cap the longest edge.
        if (Math.Max(img.Width, img.Height) > _options.MaxDimension)
        {
            Resize(img, _options.MaxDimension, _options.MaxDimension);
        }

        // 2) Encode, lowering quality until within budget.
        var quality = _options.StartQuality;
        var bytes = await EncodeAsync(img, outputFormat, quality, cancellationToken);
        while (bytes.LongLength > _options.MaxBytes && quality > _options.MinQuality)
        {
            quality = Math.Max(_options.MinQuality, quality - 10);
            bytes = await EncodeAsync(img, outputFormat, quality, cancellationToken);
        }

        // 3) Still over budget at min quality — shrink dimensions and retry.
        var guard = 0;
        while (bytes.LongLength > _options.MaxBytes && Math.Max(img.Width, img.Height) > 320 && guard < 6)
        {
            Resize(img, (int)(img.Width * 0.8), (int)(img.Height * 0.8));
            bytes = await EncodeAsync(img, outputFormat, _options.MinQuality, cancellationToken);
            guard++;
        }

        return new ImageOptimizationResult(bytes, img.Width, img.Height);
    }

    private static void Resize(Image img, int width, int height)
    {
        img.Mutate(x =>
            x.Resize(
                new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(Math.Max(1, width), Math.Max(1, height)),
                }
            )
        );
    }

    private static async Task<byte[]> EncodeAsync(
        Image img,
        ImageOutputFormat outputFormat,
        int quality,
        CancellationToken cancellationToken
    )
    {
        using var output = new MemoryStream();

        switch (outputFormat)
        {
            case ImageOutputFormat.Jpeg:
                await img.SaveAsJpegAsync(output, new JpegEncoder { Quality = quality }, cancellationToken);
                break;
            case ImageOutputFormat.Png:
                await img.SaveAsPngAsync(
                    output,
                    new PngEncoder { CompressionLevel = PngCompressionLevel.BestCompression },
                    cancellationToken
                );
                break;
            default:
                await img.SaveAsWebpAsync(output, new WebpEncoder { Quality = quality }, cancellationToken);
                break;
        }

        return output.ToArray();
    }
}
