using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.Exceptions;

namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Serves as the base class for entities, providing common properties and methods for identity management and domain events handling.
/// </summary>
public abstract class Entity : IEntity
{
    #region Properties

    /// <inheritdoc />
    public DateTime CreateDate { get; private set; } = SystemClock.Now;

    /// <inheritdoc />
    public DateTime? LastModifiedDate { get; private set; }

    #endregion

    #region Rule

    /// <summary>
    /// Checks the specified business rule and throws a <see cref="BusinessRuleValidationException"/> if it's broken.
    /// </summary>
    /// <param name="rule">The business rule to check.</param>
    protected static void CheckRule(IBusinessRule rule)
    {
        if (rule.IsBroken())
        {
            throw new BusinessRuleValidationException(rule);
        }
    }

    #endregion

    #region MyRegion

    /// <inheritdoc />
    public void SetModifiedDate(DateTime dateTime)
    {
        LastModifiedDate = dateTime;
    }

    /// <inheritdoc />
    public void SetCreateDate(DateTime dateTime)
    {
        CreateDate = dateTime;
    }

    #endregion
}

/// <summary>
/// Serves as the base class for entities, providing common properties and methods for identity management and domain events handling.
/// </summary>
/// <typeparam name="T">The type of the unique identifier for this entity.</typeparam>
public abstract class Entity<T> : Entity, IEntity<T>
    where T : TypedIdValueBase
{
    #region Properties

    /// <inheritdoc />
    public T Id { get; protected init; } = default!;

    #endregion
}
