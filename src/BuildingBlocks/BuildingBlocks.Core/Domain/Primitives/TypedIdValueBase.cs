using Ardalis.GuardClauses;

namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Represents the base class for typed identifier values.
/// </summary>
public abstract record TypedIdValueBase
{
    /// <summary>
    /// Gets the value of the identifier.
    /// </summary>
    public Guid Value { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="TypedIdValueBase"/> class.
    /// </summary>
    /// <param name="value">The value of the identifier.</param>
    protected TypedIdValueBase(Guid value)
    {
        Value = Guard.Against.Default(value, nameof(value));
    }

    /// <summary>
    /// Converts the specified identifier to a <see cref="Guid"/>.
    /// </summary>
    /// <param name="id">The identifier to convert.</param>
    /// <returns>The <see cref="Guid"/> representation of the identifier.</returns>
    public static implicit operator Guid(TypedIdValueBase id) => id.Value;

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}
