using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents an exception that is thrown when an error occurs in the application.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="statusCode">The status code.</param>
/// <param name="innerException">The inner exception.</param>
public class AppException(
    string message,
    int statusCode = StatusCodes.Status400BadRequest,
    Exception? innerException = null
) : CustomException(message, statusCode, innerException);
