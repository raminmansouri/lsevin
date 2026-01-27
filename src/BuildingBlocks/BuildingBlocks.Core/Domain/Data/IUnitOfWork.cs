namespace BuildingBlocks.Core.Domain.Data;

/// <summary>
/// Provides a contract for implementing the Unit of Work pattern,
/// which helps in managing transactions and achieving data consistency
/// across multiple operations.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Persists all changes made within this unit of work to the database.
    /// </summary>
    /// <param name="cancellationToken">A token to observe while waiting for the task to complete.</param>
    /// <returns>A task that represents the asynchronous save operation, containing the number of state entries written to the database.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Persists all changes made within this unit of work to the database and ensures the domain events are dispatched.
    /// </summary>
    /// <param name="cancellationToken">A token to observe while waiting for the task to complete.</param>
    /// <returns>A task that represents the asynchronous operation, containing a flag indicating whether the save operation succeeded.</returns>
    Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default);
}
