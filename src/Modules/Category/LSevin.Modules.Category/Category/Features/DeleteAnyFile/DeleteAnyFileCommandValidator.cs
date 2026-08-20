using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.Category.Features.DeleteAnyFile;

/// <summary>
/// Constrains what this endpoint is allowed to delete.
/// </summary>
/// <remarks>
/// Delete-by-path is a sharp tool, so the authority is bounded here rather than left to the
/// storage layer. <c>IFileService</c> already refuses traversal, but "not traversal" is a much
/// weaker property than "inside the media namespace": without a prefix rule an admin panel
/// action could name <c>CustomerDocument/…</c> and destroy a customer's document. Those have
/// their own owner-scoped delete feature and must not be reachable from here.
/// </remarks>
public sealed class DeleteAnyFileCommandValidator : AbstractValidator<DeleteAnyFileCommand>
{
    /// <summary>
    /// The prefixes this endpoint may delete under — the two the media library actually uses,
    /// and the same two the object store exposes for anonymous reads.
    /// </summary>
    private static readonly string[] DeletablePrefixes = ["Categories/", "ServiceProviders/"];

    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteAnyFileCommandValidator"/> class.
    /// </summary>
    public DeleteAnyFileCommandValidator()
    {
        RuleFor(x => x.Path)
            .NotEmpty()
            .WithMessage("A file path is required.")
            .Must(path => !path.Contains("..", StringComparison.Ordinal))
            .WithMessage("The file path must not contain a relative segment.")
            .Must(path => !path.StartsWith('/') && !path.StartsWith('\\'))
            .WithMessage("The file path must be relative.")
            .Must(BeInsideMediaNamespace)
            .WithMessage(
                $"Only files under {string.Join(" or ", DeletablePrefixes)} can be deleted here."
            );
    }

    private static bool BeInsideMediaNamespace(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        // Historic rows written on Windows carry a backslash; compare on the normalized form
        // so a stale value is judged by where it points, not by which separator it happens
        // to use.
        var normalized = path.Replace('\\', '/');

        return DeletablePrefixes.Any(prefix => normalized.StartsWith(prefix, StringComparison.Ordinal));
    }
}
