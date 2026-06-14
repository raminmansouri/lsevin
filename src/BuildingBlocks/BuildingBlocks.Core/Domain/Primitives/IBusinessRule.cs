namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Represents a business rule validation contract. Business rules encapsulate
/// specific business logic and validation that need to be enforced in the domain.
/// </summary>
public interface IBusinessRule
{
    /// <summary>
    /// Checks whether the business rule is broken.
    /// </summary>
    /// <returns>
    /// True if the business rule is broken, false otherwise.
    /// </returns>
    bool IsBroken();

    /// <summary>
    /// Gets the message that explains the business rule.
    /// </summary>
    string Message { get; }
}
