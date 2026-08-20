using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// The destination uploaded bytes are written to, once <see cref="FileService"/> has
/// validated, optimized and named them.
/// </summary>
/// <remarks>
/// This exists so that switching to object storage does not fork the upload pipeline.
/// Everything that decides <em>what</em> gets stored — the multipart reader, the allowed
/// extension list, the size budget, the ImageSharp optimization pass and the generated
/// filename — is backend-independent and lives in one place. Only <em>where</em> the
/// final bytes land differs, and that is these two methods.
/// <para>
/// Paths are always relative and always use forward slashes, because the same string is
/// stored in the database, served under <c>/files/</c> and used verbatim as the object
/// key. Implementations translate to platform separators only if their storage needs it.
/// </para>
/// </remarks>
internal interface IFileObjectStore
{
    /// <summary>
    /// Writes the content at the given relative path, replacing anything already there.
    /// </summary>
    /// <param name="relativePath">Forward-slash relative path, e.g. <c>Categories/services/019e….webp</c>.</param>
    /// <param name="content">The bytes to store.</param>
    /// <param name="contentType">The MIME type to record, derived from the stored extension.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    Task WriteAsync(
        string relativePath,
        byte[] content,
        string contentType,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Deletes the object at the given relative path.
    /// </summary>
    /// <param name="relativePath">Forward-slash relative path.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>
    /// Success when removed; a not-found error when it was not there; a forbidden error
    /// when the path escapes the storage root.
    /// </returns>
    Task<Result> DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
}
