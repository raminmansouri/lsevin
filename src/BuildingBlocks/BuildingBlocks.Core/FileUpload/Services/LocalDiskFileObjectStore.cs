using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Options;
using BuildingBlocks.Core.ResultPattern;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Stores uploads on the local filesystem under the configured upload directory.
/// This is the historical behaviour and remains the default.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="LocalDiskFileObjectStore"/> class.
/// </remarks>
/// <param name="options">The file upload options.</param>
internal sealed class LocalDiskFileObjectStore(IOptions<FileUploadOptions> options) : IFileObjectStore
{
    private readonly FileUploadOptions _options = options.Value;

    /// <inheritdoc />
    public async Task WriteAsync(
        string relativePath,
        byte[] content,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        // contentType is not used: the filesystem carries no metadata, and everything
        // downstream infers the type from the extension. It is part of the contract
        // because object storage does record it.
        var fullPath = Path.Combine(_options.UploadDirectory, ToPlatformPath(relativePath));
        var directory = Path.GetDirectoryName(fullPath);

        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllBytesAsync(fullPath, content, cancellationToken);
    }

    /// <inheritdoc />
    public Task<Result> DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        Guard.Against.NullOrEmpty(relativePath, nameof(relativePath));

        var normalizedPath = Path.GetFullPath(
            Path.Combine(_options.UploadDirectory, ToPlatformPath(relativePath))
        );

        if (!normalizedPath.StartsWith(Path.GetFullPath(_options.UploadDirectory), StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(Result.Error(AppError.ForbiddenError(relativePath)));
        }

        if (!File.Exists(normalizedPath))
        {
            return Task.FromResult(Result.Error(AppError.NotFoundErrorMessage(relativePath)));
        }

        File.Delete(normalizedPath);

        // File.Delete has no async counterpart; the Task is completed, not fake work.
        return Task.FromResult(Result.Success());
    }

    /// <summary>
    /// Converts a stored forward-slash relative path to this platform's separator.
    /// </summary>
    /// <remarks>
    /// On Linux this is a no-op. It matters on Windows, where a developer machine would
    /// otherwise be handed a path mixing both separators.
    /// </remarks>
    private static string ToPlatformPath(string relativePath) =>
        Path.DirectorySeparatorChar == '/'
            ? relativePath
            : relativePath.Replace('/', Path.DirectorySeparatorChar);
}
