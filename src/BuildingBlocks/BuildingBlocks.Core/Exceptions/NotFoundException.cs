using BuildingBlocks.Core.Domain.Exceptions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling not found errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public sealed class NotFoundException(string message, Exception? innerException = null)
    : CustomException(message, StatusCodes.Status404NotFound, innerException);

/// <summary>
/// Represents a custom exception for handling not found errors.
/// </summary>
/// <param name="message">The message that describes the error.</param>
/// <param name="innerException">The inner exception.</param>
public sealed class NotFoundAppException(string message, Exception? innerException = null)
    : AppException(message, StatusCodes.Status404NotFound, innerException);

/// <summary>
/// Represents a custom exception for handling not found errors.
/// </summary>
public sealed class NotFoundDomainException : DomainException
{
    /// <summary>
    /// Initializes a new instance of the <see cref="NotFoundDomainException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    public NotFoundDomainException(string message)
        : base(message, StatusCodes.Status404NotFound) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="NotFoundDomainException"/> class.
    /// </summary>
    /// <param name="businessRuleType">The type of the business rule.</param>
    /// <param name="message">The message that describes the error.</param>
    public NotFoundDomainException(Type businessRuleType, string message)
        : base(businessRuleType, message, StatusCodes.Status404NotFound) { }
}
