using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Models;
using BuildingBlocks.Core.FileUpload.Options;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.ResultPattern;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Represents the file service.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="FileService"/> class.
/// </remarks>
/// <param name="options">The file upload options.</param>
/// <param name="imageOptimizer">The image optimizer (enforced server-side layer).</param>
/// <param name="imageOptions">The image optimization options.</param>
internal sealed class FileService(
    IOptions<FileUploadOptions> options,
    IImageOptimizer imageOptimizer,
    IOptions<ImageOptimizationOptions> imageOptions
) : IFileService
{
    private readonly FileUploadOptions _options = options.Value;
    private readonly IImageOptimizer _imageOptimizer = imageOptimizer;
    private readonly ImageOptimizationOptions _imageOptions = imageOptions.Value;

    /// <inheritdoc />
    public async Task<Result<FileUploadSummary>> UploadFileAsync(
        Stream fileStream,
        string directory,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        var fileCount = 0;
        long totalSizeInBytes = 0;

        var boundary = GetBoundary(MediaTypeHeaderValue.Parse(contentType));
        var multipartReader = new MultipartReader(boundary, fileStream);
        var section = await multipartReader.ReadNextSectionAsync(cancellationToken);

        List<string> filePaths = [];
        List<string> notUploadedFiles = [];

        while (section is not null)
        {
            var fileSection = section.AsFileSection();

            if (fileSection?.FileStream is not null)
            {
                var extension = Path.GetExtension(fileSection.FileName);

                if (!_options.AllowedFileExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    notUploadedFiles.Add(fileSection.FileName);
                }
                else
                {
                    var saved = await ProcessAndSaveAsync(
                        fileSection.FileStream,
                        fileSection.FileName,
                        directory,
                        cancellationToken
                    );

                    if (saved is { } file)
                    {
                        filePaths.Add(file.RelativePath);
                        totalSizeInBytes += file.Bytes;
                        fileCount++;
                    }
                    else
                    {
                        notUploadedFiles.Add(fileSection.FileName);
                    }
                }
            }

            section = await multipartReader.ReadNextSectionAsync(cancellationToken);
        }

        return new FileUploadSummary(fileCount, ConvertSizeToString(totalSizeInBytes), filePaths, notUploadedFiles);
    }

    /// <inheritdoc />
    public async Task<Result<FileUploadSummary>> UploadSingleFileAsync(
        IFormFile file,
        string directory,
        CancellationToken cancellationToken = default
    )
    {
        if (file == null || file.Length == 0)
        {
            return Result.Error<FileUploadSummary>(AppError.ApplicationErrorMessage("File is empty or null"));
        }

        var extension = Path.GetExtension(file.FileName);

        if (!_options.AllowedFileExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            return Result.Error<FileUploadSummary>(
                AppError.ApplicationErrorMessage($"File extension {extension} is not allowed")
            );
        }

        await using var input = file.OpenReadStream();
        var saved = await ProcessAndSaveAsync(input, file.FileName, directory, cancellationToken);

        if (saved is not { } result)
        {
            return Result.Error<FileUploadSummary>(
                AppError.ApplicationErrorMessage("File is empty or exceeds the maximum upload size")
            );
        }

        return Result.Success(
            new FileUploadSummary(1, ConvertSizeToString(result.Bytes), [result.RelativePath], [])
        );
    }

    /// <inheritdoc />
    public async Task<Result<FileUploadSummary>> UploadMultipleFilesAsync(
        IEnumerable<IFormFile> files,
        string directory,
        CancellationToken cancellationToken = default
    )
    {
        var filesList = files?.ToList();
        if (filesList == null || filesList.Count == 0)
        {
            return Result.Error<FileUploadSummary>(AppError.ApplicationErrorMessage("No files provided for upload"));
        }

        var uploadedFilePaths = new List<string>();
        var notUploadedFiles = new List<string>();
        long totalSizeInBytes = 0;
        var fileCount = 0;

        foreach (var file in filesList)
        {
            if (file == null || file.Length == 0)
            {
                notUploadedFiles.Add(file?.FileName ?? "unknown");
                continue;
            }

            var extension = Path.GetExtension(file.FileName);

            if (!_options.AllowedFileExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                notUploadedFiles.Add(file.FileName);
                continue;
            }

            await using var input = file.OpenReadStream();
            var saved = await ProcessAndSaveAsync(input, file.FileName, directory, cancellationToken);

            if (saved is { } result)
            {
                uploadedFilePaths.Add(result.RelativePath);
                totalSizeInBytes += result.Bytes;
                fileCount++;
            }
            else
            {
                notUploadedFiles.Add(file.FileName);
            }
        }

        var totalFileSize = ConvertSizeToString(totalSizeInBytes);
        return Result.Success(new FileUploadSummary(fileCount, totalFileSize, uploadedFilePaths, notUploadedFiles));
    }

    /// <inheritdoc />
    public Result DeleteFile(string filePath)
    {
        Guard.Against.NullOrEmpty(filePath, nameof(filePath));

        var normalizedPath = Path.GetFullPath(Path.Combine(_options.UploadDirectory, filePath));

        if (!normalizedPath.StartsWith(Path.GetFullPath(_options.UploadDirectory), StringComparison.OrdinalIgnoreCase))
        {
            return Result.Error(AppError.ForbiddenError(filePath));
        }

        if (!File.Exists(normalizedPath))
        {
            return Result.Error(AppError.NotFoundErrorMessage(filePath));
        }

        File.Delete(normalizedPath);

        return Result.Success();
    }

    /// <summary>
    /// Buffers the incoming stream, runs the image-optimization pipeline when applicable,
    /// then writes the (optimized) bytes to disk under a generated, traversal-safe filename.
    /// </summary>
    /// <returns>The stored relative path and byte length, or <c>null</c> if rejected (empty / too large).</returns>
    private async Task<SavedFile?> ProcessAndSaveAsync(
        Stream content,
        string originalFileName,
        string directory,
        CancellationToken cancellationToken
    )
    {
        var savingPath = Path.Combine(_options.UploadDirectory, directory);
        Directory.CreateDirectory(savingPath);

        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);

        if (buffer.Length == 0)
        {
            return null;
        }

        if (_imageOptions.MaxUploadBytes > 0 && buffer.Length > _imageOptions.MaxUploadBytes)
        {
            return null;
        }

        var extension = Path.GetExtension(originalFileName);
        byte[] outputBytes;
        var outputExtension = extension;

        if (_imageOptions.Enabled && _imageOptimizer.IsOptimizableExtension(extension))
        {
            buffer.Position = 0;
            var inspect = await _imageOptimizer.InspectAsync(buffer, cancellationToken);

            if (inspect.IsImage && !IsAlreadyOptimized(inspect))
            {
                buffer.Position = 0;
                var optimized = await _imageOptimizer.OptimizeAsync(
                    buffer,
                    ImageOutputFormat.Webp,
                    cancellationToken
                );
                outputBytes = optimized.Bytes;
                outputExtension = ".webp";
            }
            else
            {
                // Already WebP within budget (optimize-once guard) or undecodable — store as-is.
                outputBytes = buffer.ToArray();
            }
        }
        else
        {
            outputBytes = buffer.ToArray();
        }

        var fileName = IdGenerator.NewId().ToString() + outputExtension;
        var filePath = Path.Combine(savingPath, fileName);
        var relativeFilePath = Path.Combine(directory, fileName);

        await File.WriteAllBytesAsync(filePath, outputBytes, cancellationToken);

        return new SavedFile(relativeFilePath, outputBytes.LongLength);
    }

    /// <summary>
    /// Phase 2 defensive guard: a file that is already WebP, already within the size budget,
    /// and within the max dimension must not be re-encoded.
    /// </summary>
    private bool IsAlreadyOptimized(ImageInspectResult inspect) =>
        inspect.IsWebp
        && inspect.Bytes <= _imageOptions.MaxBytes
        && Math.Max(inspect.Width, inspect.Height) <= _imageOptions.MaxDimension;

    private sealed record SavedFile(string RelativePath, long Bytes);

    /// <summary>
    /// Gets the boundary.
    /// </summary>
    /// <param name="contentType">The content type.</param>
    /// <returns>The boundary.</returns>
    private static string GetBoundary(MediaTypeHeaderValue contentType)
    {
        var boundary = HeaderUtilities.RemoveQuotes(contentType.Boundary).Value;
        Guard.Against.NullOrEmpty(boundary, nameof(boundary));

        return boundary;
    }

    /// <summary>
    /// Converts the size to string.
    /// </summary>
    /// <param name="bytes">The bytes.</param>
    /// <returns>The size in string.</returns>
    private static string ConvertSizeToString(long bytes)
    {
        var fileSize = new decimal(bytes);
        var kibibyte = new decimal(1024);
        var mebibyte = new decimal(1024 * 1024);
        var gibibyte = new decimal(1024 * 1024 * 1024);

        return fileSize switch
        {
            _ when fileSize < kibibyte => "Less than 1KB",
            _ when fileSize < mebibyte =>
                $"{Math.Round(
                               fileSize / kibibyte,
                               fileSize < 10 * kibibyte ? 2 : 1,
                               MidpointRounding.AwayFromZero):##,###.##} KB",
            _ when fileSize < gibibyte =>
                $"{Math.Round(
                               fileSize / mebibyte,
                               fileSize < 10 * mebibyte ? 2 : 1,
                               MidpointRounding.AwayFromZero):##,###.##} MB",
            _ when fileSize >= gibibyte =>
                $"{Math.Round(
                               fileSize / gibibyte,
                               fileSize < 10 * gibibyte ? 2 : 1,
                               MidpointRounding.AwayFromZero):##,###.##} GB",
            _ => "n/a",
        };
    }
}
