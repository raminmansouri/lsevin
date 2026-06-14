using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents an exception that is thrown when an error occurs in the API.
/// </summary>
public sealed class ApiException : CustomException
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ApiException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="statusCode">The status code.</param>
    public ApiException(string message, int statusCode = StatusCodes.Status500InternalServerError)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
