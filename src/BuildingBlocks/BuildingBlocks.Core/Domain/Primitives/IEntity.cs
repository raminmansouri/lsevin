namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Represents the contract of an entity in the domain-driven design (DDD) context.
/// </summary>
/// <typeparam name="T">The type of the unique identifier for this entity.</typeparam>
public interface IEntity<out T> : IEntity
    where T : TypedIdValueBase
{
    /// <summary>
    /// Gets the unique identifier for this entity.
    /// </summary>
    T Id { get; }
}

/// <summary>
/// Represents the contract of an entity in the domain-driven design (DDD) context.
/// </summary>
public interface IEntity
{
    /// <summary>
    /// Gets the Creation date of this entity.
    /// </summary>
    DateTime CreateDate { get; }

    /// <summary>
    /// Gets the last modified date of this entity.
    /// </summary>
    DateTime? LastModifiedDate { get; }

    /// <summary>
    /// Sets the last modified date of this entity.
    /// </summary>
    /// <param name="dateTime">The date time to set.</param>
    void SetModifiedDate(DateTime dateTime);

    /// <summary>
    /// Sets the creation date of this entity.
    /// </summary>
    /// <param name="dateTime">The date time to set.</param>
    void SetCreateDate(DateTime dateTime);
}
