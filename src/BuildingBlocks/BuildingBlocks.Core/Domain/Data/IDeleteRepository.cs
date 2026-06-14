using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Data;

/// <summary>
/// Provides an interface for a repository with delete capabilities for aggregate roots of type <typeparamref name="T"/>.
/// </summary>
/// <typeparam name="T">The type of the aggregate root.</typeparam>
public interface IDeleteRepository<in T>
    where T : IAggregateRoot
{
    /// <summary>
    /// Deletes the specified item within a unit of work.
    /// </summary>
    /// <param name="item">The item to delete.</param>
    void Delete(T item);

    /// <summary>
    /// Deletes the specified range of items within a unit of work.
    /// </summary>
    /// <param name="items">The items to delete.</param>
    void DeleteRange(IEnumerable<T> items);

    /// <summary>
    /// Deletes the specified item.
    /// </summary>
    /// <param name="item">The item to delete.</param>
    void DeleteWithAttach(T item);

    /// <summary>
    /// Deletes the specified range of items.
    /// </summary>
    /// <param name="items">The items to delete.</param>
    void DeleteRangeWithAttach(IEnumerable<T> items);
}
