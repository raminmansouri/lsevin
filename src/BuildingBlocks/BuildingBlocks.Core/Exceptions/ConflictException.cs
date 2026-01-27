using BuildingBlocks.Core.Domain.Exceptions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling conflict errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public class ConflictException(string message, Exception? innerException = null)
    : CustomException(message, StatusCodes.Status409Conflict, innerException);

/// <summary>
/// Represents a custom exception for handling conflict errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public class ConflictAppException(string message, Exception? innerException = null)
    : AppException(message, StatusCodes.Status409Conflict, innerException);

/// <summary>
/// Represents a custom exception for handling conflict errors.
/// </summary>
public class ConflictDomainException : DomainException
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ConflictDomainException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    public ConflictDomainException(string message)
        : base(message) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="ConflictDomainException"/> class.
    /// </summary>
    /// <param name="businessRuleType">The type of the business rule.</param>
    /// <param name="message">The message that describes the error.</param>
    public ConflictDomainException(Type businessRuleType, string message)
        : base(businessRuleType, message) { }
}
