using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Persistence.EventSourcing.EventStore;

/// <summary>
/// Represents the repository extensions.
/// </summary>
public static class EventStoreExtensions
{
    /// <summary>
    /// Gets the aggregate.
    /// </summary>
    /// <typeparam name="T">The type of the aggregate.</typeparam>
    /// <typeparam name="TId">The type of the identifier.</typeparam>
    /// <param name="repository">The repository.</param>
    /// <param name="id">The identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate.</returns>
    public static async Task<T> Get<T, TId>(
        this IEventStore<T, TId> repository,
        long id,
        CancellationToken cancellationToken
    )
        where T : class, IEventSourcedAggregate<TId>
        where TId : TypedIdValueBase
    {
        var entity = await repository.FindAsync(id, cancellationToken);
        ArgumentNullException.ThrowIfNull(entity);

        return entity;
    }

    /// <summary>
    /// Gets or updates the aggregate.
    /// </summary>
    /// <typeparam name="T">The type of the aggregate.</typeparam>
    /// <typeparam name="TId">The type of the identifier.</typeparam>
    /// <param name="repository">The repository.</param>
    /// <param name="id">The identifier.</param>
    /// <param name="action">The action to update the aggregate.</param>
    /// <param name="expectedVersion">The expected version.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate.</returns>
    public static async Task<ulong> GetAndUpdate<T, TId>(
        this IEventStore<T, TId> repository,
        long id,
        Action<T> action,
        long? expectedVersion = null,
        CancellationToken cancellationToken = default
    )
        where T : class, IEventSourcedAggregate<TId>
        where TId : TypedIdValueBase
    {
        var entity = await repository.Get(id, cancellationToken);

        action(entity);

        return await repository.UpdateAsync(entity, expectedVersion, cancellationToken);
    }
}
