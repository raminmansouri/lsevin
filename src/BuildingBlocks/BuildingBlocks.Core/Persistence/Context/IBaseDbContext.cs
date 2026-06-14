using BuildingBlocks.Core.Domain.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace BuildingBlocks.Core.Persistence.Context;

/// <summary>
/// Provides an interface for a base database context with various database-related operations.
/// </summary>
public interface IBaseDbContext : IUnitOfWork
{
    /// <summary>
    /// Gets the database instance associated with this context.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <returns>The <see cref="DbSet{TEntity}"/> instance for the specified entity type.</returns>
    DbSet<TEntity> Set<TEntity>()
        where TEntity : class;

    /// <summary>
    /// Gets the database instance associated with this context.
    /// </summary>
    DatabaseFacade Database { get; }

    /// <summary>
    /// Gets a value indicating whether indicates whether an active database transaction exists.
    /// </summary>
    ///
    bool HasActiveTransaction { get; }

    /// <summary>
    /// Gets the current database transaction, if one exists.
    /// </summary>
    /// <returns>The current IDbContextTransaction or null if no transaction exists.</returns>
    IDbContextTransaction? GetCurrentTransaction();

    /// <summary>
    /// Asynchronously begins a new database transaction.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A Task representing the new IDbContextTransaction.</returns>
    Task<IDbContextTransaction?> BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Asynchronously commits the specified database transaction.
    /// </summary>
    /// <param name="transaction">The IDbContextTransaction to commit.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A Task representing the completion of the commit operation.</returns>
    Task CommitTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the current database transaction.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
