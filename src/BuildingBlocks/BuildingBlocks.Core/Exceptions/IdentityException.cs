using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents an exception that is thrown when an error occurs in the identity module.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="statusCode">The status code.</param>
/// <param name="innerException">The inner exception.</param>
/// <param name="errors">The errors.</param>
public class IdentityException(
    string message,
    int statusCode = StatusCodes.Status400BadRequest,
    Exception? innerException = null,
    params string[] errors
) : CustomException(message, statusCode, innerException, errors);
