using BuildingBlocks.Core.Exceptions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Domain.Exceptions;

/// <summary>
/// Represents a custom exception for handling domain errors.
/// </summary>
public class DomainException : CustomException
{
    private readonly Type? _brokenRuleType;

    /// <summary>
    /// Initializes a new instance of the <see cref="DomainException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="statusCode">The status code.</param>
    public DomainException(string message, int statusCode = StatusCodes.Status409Conflict)
        : base(message, statusCode) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="DomainException"/> class with the specified business rule.
    /// </summary>
    /// <param name="businessRuleType">The business rule that triggered the exception.</param>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="statusCode">The status code.</param>
    public DomainException(Type businessRuleType, string message, int statusCode = StatusCodes.Status409Conflict)
        : base(message, statusCode)
    {
        _brokenRuleType = businessRuleType;
    }

    /// <inheritdoc />
    public override string ToString()
    {
        return _brokenRuleType is not null
            ? $"{GetType().FullName}:{_brokenRuleType.FullName}"
            : $"{GetType().FullName}";
    }
}
