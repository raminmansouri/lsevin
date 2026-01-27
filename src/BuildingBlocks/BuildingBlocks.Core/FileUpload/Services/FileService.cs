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
/// <param name="options">The options.</param>
internal sealed class FileService(IOptions<FileUploadOptions> options) : IFileService
{
    private readonly FileUploadOptions _options = options.Value;

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

            if (fileSection is not null)
            {
                var result = await SaveFileAsync(
                    fileSection,
                    allowedExtensions: _options.AllowedFileExtensions,
                    directory,
                    filePaths,
                    notUploadedFiles,
                    cancellationToken
                );

                if (result > 0)
                {
                    totalSizeInBytes += result;
                    fileCount++;
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

        var savingPath = Path.Combine(_options.UploadDirectory, directory);
        Directory.CreateDirectory(savingPath);

        var fileName = IdGenerator.NewId().ToString() + extension;
        var filePath = Path.Combine(savingPath, fileName);
        var relativeFilePath = Path.Combine(directory, fileName);

        await using var stream = new FileStream(
            filePath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 1024,
            useAsync: true
        );

        await using var fileStream = file.OpenReadStream();
        await fileStream.CopyToAsync(stream, cancellationToken);

        var filePaths = new List<string> { relativeFilePath };
        var fileSize = ConvertSizeToString(file.Length);

        return Result.Success(new FileUploadSummary(1, fileSize, filePaths, new List<string>()));
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

        var savingPath = Path.Combine(_options.UploadDirectory, directory);
        Directory.CreateDirectory(savingPath);

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

            var fileName = IdGenerator.NewId().ToString() + extension;
            var filePath = Path.Combine(savingPath, fileName);
            var relativeFilePath = Path.Combine(directory, fileName);

            await using var stream = new FileStream(
                filePath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 1024,
                useAsync: true
            );

            await using var fileStream = file.OpenReadStream();
            await fileStream.CopyToAsync(stream, cancellationToken);

            uploadedFilePaths.Add(relativeFilePath);
            totalSizeInBytes += file.Length;
            fileCount++;
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
    /// Gets the full file path.
    /// </summary>
    /// <param name="fileSection">The file section.</param>
    /// <param name="uploadDirectory">The upload directory.</param>
    /// <returns>The full file path.</returns>
    private static string GetFullFilePath(FileMultipartSection fileSection, string uploadDirectory)
    {
        return !string.IsNullOrEmpty(fileSection.FileName)
            ? Path.Combine(
                // Directory.GetCurrentDirectory(),
                uploadDirectory,
                fileSection.FileName
            )
            : string.Empty;
    }

    /// <summary>
    /// Saves the file asynchronously.
    /// </summary>
    /// <param name="fileSection">The file section.</param>
    /// <param name="allowedExtensions">The allowed extensions.</param>
    /// <param name="directory">The directory.</param>
    /// <param name="filePaths">The file paths.</param>
    /// <param name="notUploadedFiles">The not uploaded files.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The file upload summary.</returns>
    private async Task<long> SaveFileAsync(
        FileMultipartSection fileSection,
        IList<string> allowedExtensions,
        string directory,
        IList<string> filePaths,
        IList<string> notUploadedFiles,
        CancellationToken cancellationToken = default
    )
    {
        var extension = Path.GetExtension(fileSection.FileName);

        if (!allowedExtensions.Contains(extension, StringComparer.Ordinal))
        {
            notUploadedFiles.Add(fileSection.FileName);
            return 0;
        }

        var savingPath = Path.Combine(_options.UploadDirectory, directory);

        Directory.CreateDirectory(savingPath);

        var filePath = Path.Combine(savingPath, fileSection.FileName);

        await using var stream = new FileStream(
            filePath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 1024,
            useAsync: true
        );

        if (fileSection.FileStream is null)
        {
            return 0;
        }

        await fileSection.FileStream.CopyToAsync(stream, cancellationToken);

        filePaths.Add(GetFullFilePath(fileSection, directory));

        return fileSection.FileStream.Length;
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
