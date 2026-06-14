using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling bad request errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
/// <param name="errors">The errors.</param>
public sealed class BadRequestException(string message, System.Exception? innerException = null, params string[] errors)
    : CustomException(message, StatusCodes.Status400BadRequest, innerException, errors);
