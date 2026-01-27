using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Domain.Exceptions;

/// <summary>
/// Represents an exception that occurs when a business rule validation fails.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="BusinessRuleValidationException"/> class with the specified broken business rule.
/// </remarks>
/// <param name="brokenRule">The broken business rule that triggered the exception.</param>
public sealed class BusinessRuleValidationException(IBusinessRule brokenRule) : Exception(brokenRule.Message)
{
    /// <summary>
    /// Gets the broken business rule that triggered the exception.
    /// </summary>
    public IBusinessRule BrokenRule { get; } = brokenRule;

    /// <summary>
    /// Gets the detailed message explaining the reason for the business rule validation failure.
    /// </summary>
    public string Details { get; } = brokenRule.Message;

    /// <inheritdoc />
    public override string ToString()
    {
        return $"{TypeMapper.GetFullTypeName(BrokenRule.GetType())}: {BrokenRule.Message}";
    }
}
