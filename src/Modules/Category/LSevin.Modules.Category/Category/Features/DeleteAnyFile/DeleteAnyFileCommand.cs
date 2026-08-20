using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.DeleteAnyFile;

/// <summary>
/// Deletes a stored media object by the relative path held in the database.
/// </summary>
/// <param name="Path">
/// The stored relative path, for example <c>Categories/services/019e….webp</c>. This is the
/// same value that upload returned and that the database holds, not a filesystem path.
/// </param>
public sealed record DeleteAnyFileCommand(string Path) : Command<bool>;
