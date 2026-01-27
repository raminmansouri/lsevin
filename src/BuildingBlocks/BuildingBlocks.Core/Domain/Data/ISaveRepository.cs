using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Data;

/// <summary>
/// Provides an interface for saving operations on entities of type <typeparamref name="T"/>.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
public interface ISaveRepository<T>
    where T : IAggregateRoot
{
    /// <summary>
    /// Creates a new entity.
    /// </summary>
    /// <param name="item">The entity to create.</param>
    /// <returns>A Task representing the created entity.</returns>
    T Create(T item);

    /// <summary>
    /// Creates a new entity within a unit of work asynchronously.
    /// </summary>
    /// <param name="item">The entity to create.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A Task representing the created entity.</returns>
    Task<T> CreateAsync(T item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a range of entities.
    /// </summary>
    /// <param name="items">The entities to create.</param>
    /// <returns>A Task representing a collection of created entities.</returns>
    IReadOnlyList<T> CreateRange(IEnumerable<T> items);

    /// <summary>
    /// Creates a range of entities within a unit of work asynchronously.
    /// </summary>
    /// <param name="items">The entities to create.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A Task representing a collection of created entities.</returns>
    Task<IEnumerable<T>> CreateRangeAsync(IEnumerable<T> items, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing entity.
    /// </summary>
    /// <param name="item">The entity to update.</param>
    void Update(T item);

    /// <summary>
    /// Updates a range of existing entities.
    /// </summary>
    /// <param name="items">The entities to update.</param>
    void UpdateRange(IEnumerable<T> items);

    /// <summary>
    /// Updates an existing entity by attaching.
    /// </summary>
    /// <param name="item">The entity to update.</param>
    void UpdateWithAttach(T item);

    /// <summary>
    /// Updates a range of existing entities with attaching.
    /// </summary>
    /// <param name="items">The entities to update.</param>
    void UpdateRangeWithAttach(IEnumerable<T> items);
}
