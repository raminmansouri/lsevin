using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Persistence.EventSourcing.EventStore;

/// <summary>
/// Represents the event store.
/// </summary>
public interface IEventStore<T, TId>
    where T : class, IEventSourcedAggregate<TId>
    where TId : TypedIdValueBase
{
    /// <summary>
    /// Finds the aggregate.
    /// </summary>
    /// <param name="id">The aggregate identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate.</returns>
    Task<T?> FindAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds the aggregate.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate version.</returns>
    Task<ulong> AddAsync(T aggregate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the aggregate.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <param name="expectedRevision">The expected revision.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate version.</returns>
    Task<ulong> UpdateAsync(T aggregate, long? expectedRevision = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes the aggregate.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <param name="expectedRevision">The expected revision.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The aggregate version.</returns>
    Task<ulong> DeleteAsync(T aggregate, long? expectedRevision = null, CancellationToken cancellationToken = default);
}
