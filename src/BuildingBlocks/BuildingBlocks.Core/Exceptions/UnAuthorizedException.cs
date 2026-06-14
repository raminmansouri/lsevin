using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling unauthorized errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public sealed class UnAuthorizedException(string message, Exception? innerException = null)
    : IdentityException(message, StatusCodes.Status401Unauthorized, innerException);
