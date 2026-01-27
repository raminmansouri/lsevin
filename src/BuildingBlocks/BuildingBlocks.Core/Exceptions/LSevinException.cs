using BuildingBlocks.Core.ErrorHandling;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling application exceptions.
/// </summary>
public sealed class LSevinException(string requestName, AppError? error = null, Exception? innerException = null)
    : Exception("Application exception", innerException)
{
    /// <summary>
    /// Gets the request name.
    /// </summary>
    public string RequestName { get; } = requestName;

    /// <summary>
    /// Gets the error.
    /// </summary>
    public AppError? Error { get; } = error;
}
