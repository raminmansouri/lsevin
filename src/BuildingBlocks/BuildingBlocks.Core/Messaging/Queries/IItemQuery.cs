namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the item query.
/// </summary>
/// <typeparam name="TId">The type of the identifier.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
public interface IItemQuery<out TId, TResponse> : IQuery<TResponse>
    where TId : struct
    where TResponse : notnull
{
    /// <summary>
    /// Gets the identifier.
    /// </summary>
    public TId Id { get; }

    /// <summary>
    /// Gets the includes.
    /// </summary>
    public IList<string>? Includes { get; }
}
