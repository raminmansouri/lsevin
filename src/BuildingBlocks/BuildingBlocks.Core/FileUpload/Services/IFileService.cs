using BuildingBlocks.Core.FileUpload.Models;
using BuildingBlocks.Core.ResultPattern;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Represents the file service.
/// </summary>
public interface IFileService
{
    /// <summary>
    /// Uploads the file asynchronously.
    /// </summary>
    /// <param name="fileStream">The file stream.</param>
    /// <param name="directory">The directory.</param>
    /// <param name="contentType">The content type.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The file upload summary.</returns>
    Task<Result<FileUploadSummary>> UploadFileAsync(
        Stream fileStream,
        string directory,
        string contentType,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Uploads a single file asynchronously.
    /// </summary>
    /// <param name="file">The form file.</param>
    /// <param name="directory">The directory.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The file upload summary.</returns>
    Task<Result<FileUploadSummary>> UploadSingleFileAsync(
        IFormFile file,
        string directory,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Uploads multiple files asynchronously.
    /// </summary>
    /// <param name="files">The form files.</param>
    /// <param name="directory">The directory.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The file upload summary.</returns>
    Task<Result<FileUploadSummary>> UploadMultipleFilesAsync(
        IEnumerable<IFormFile> files,
        string directory,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Deletes a stored file.
    /// </summary>
    /// <param name="filePath">The relative path of the file to delete.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A result indicating success or failure.</returns>
    /// <remarks>
    /// Asynchronous because deleting from object storage is a network call. It used to be
    /// synchronous, which forced the object-storage backend to block a thread on it.
    /// </remarks>
    Task<Result> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default);
}
