using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling forbidden errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public sealed class ForbiddenException(string message, Exception? innerException = null)
    : IdentityException(message, statusCode: StatusCodes.Status403Forbidden, innerException);
