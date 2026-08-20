using System.Net;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Category.Category.Features.DeleteAnyFile;

/// <summary>
/// Removes a stored media object.
/// </summary>
/// <remarks>
/// This exists so that deleting a row from the media library can also reclaim the bytes.
/// Until now nothing could: the admin panel dropped the row and left the object behind,
/// because the web app has no credentials for the store and every other delete feature is
/// scoped to a specific entity rather than to a path.
/// <para>
/// A path that is already gone is reported as <c>false</c> rather than as an error. The
/// caller's intent is "this object should not exist", and a delete retried after a partial
/// failure must not fail the second time.
/// </para>
/// </remarks>
/// <param name="fileService">The file service.</param>
internal sealed class DeleteAnyFileCommandHandler(IFileService fileService)
    : CommandHandler<DeleteAnyFileCommand, bool>
{
    /// <inheritdoc />
    public override async Task<Result<bool>> Handle(
        DeleteAnyFileCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var result = await fileService.DeleteFileAsync(command.Path, cancellationToken);

        if (result.IsFailure)
        {
            var error = result.Errors!.First();

            // Already absent is the desired end state, so it is not surfaced as a failure.
            // Anything else — a rejected path, or the store itself erroring — must be.
            if (error.Code == (int)HttpStatusCode.NotFound)
            {
                return Result.Success(false);
            }

            return Result.Error<bool>(error);
        }

        return Result.Success(true);
    }
}
