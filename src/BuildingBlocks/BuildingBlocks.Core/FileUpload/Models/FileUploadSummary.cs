namespace BuildingBlocks.Core.FileUpload.Models;

/// <summary>
/// Represents the summary of file upload.
/// </summary>
/// <param name="TotalFileUploaded">The total number of files uploaded.</param>
/// <param name="TotalSizeUploaded">The total size of files uploaded.</param>
/// <param name="FilePaths">The list of file paths.</param>
/// <param name="NotUploadedFiles">The list of not uploaded files.</param>
public record FileUploadSummary(
    int TotalFileUploaded,
    string? TotalSizeUploaded,
    IList<string>? FilePaths,
    IList<string>? NotUploadedFiles
);
