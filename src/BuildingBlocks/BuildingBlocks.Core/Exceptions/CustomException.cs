using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception.
/// </summary>
public abstract class CustomException : Exception
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CustomException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="statusCode">The status code.</param>
    /// <param name="innerException">The inner exception.</param>
    /// <param name="errors">The errors.</param>
    protected CustomException(
        string message,
        int statusCode = StatusCodes.Status500InternalServerError,
        Exception? innerException = null,
        params string[] errors
    )
        : base(message, innerException)
    {
        ErrorMessages = errors;
        StatusCode = statusCode;
    }

    /// <summary>
    /// Gets or sets the error messages.
    /// </summary>
    public IEnumerable<string> ErrorMessages { get; protected set; }

    /// <summary>
    /// Gets or sets the status code.
    /// </summary>
    public int StatusCode { get; protected set; }

    /// <inheritdoc />
    public override string ToString()
    {
        return GetType().FullName ?? GetType().Name;
    }
}
