namespace BuildingBlocks.Core.FileUpload.Options;

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
}
