using System.Data;
using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace BuildingBlocks.Core.Persistence.Context;

/// <summary>
/// Represents the base entity framework database context.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="BaseEfDbContext"/> class with options.
/// </remarks>
/// <param name="options">The DbContextOptions for configuring the database connection.</param>
public abstract class BaseEfDbContext(DbContextOptions options) : DbContext(options), IBaseDbContext
{
    /// <summary>
    /// The current transaction.
    /// </summary>
    private IDbContextTransaction? _currentTransaction;

    /// <inheritdoc />
    public IDbContextTransaction? GetCurrentTransaction() => _currentTransaction;

    /// <inheritdoc />
    public bool HasActiveTransaction => _currentTransaction != null;

    /// <inheritdoc />
    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        var saveResult = await SaveChangesAsync(cancellationToken);
        return saveResult > 0;
    }

    /// <inheritdoc />
    public async Task<IDbContextTransaction?> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            return null;
        }

        _currentTransaction = await Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken: cancellationToken
        );

        return _currentTransaction;
    }

    /// <inheritdoc />
    public async Task CommitTransactionAsync(
        IDbContextTransaction transaction,
        CancellationToken cancellationToken = default
    )
    {
        ArgumentNullException.ThrowIfNull(transaction);

        if (transaction != _currentTransaction)
        {
            throw new InvalidOperationException($"Transaction {transaction.TransactionId} is not current");
        }

        try
        {
            await SaveChangesAsync(cancellationToken);
            if (_currentTransaction is not null)
            {
                await _currentTransaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            _currentTransaction?.Dispose();
            _currentTransaction = null;
        }
    }

    /// <inheritdoc />
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction is not null)
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            _currentTransaction?.Dispose();
            _currentTransaction = null;
        }
    }

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureAggregates(modelBuilder);
    }

    /// <summary>
    /// Adds the versioning properties to the entity.
    /// </summary>
    /// <param name="builder">The builder.</param>
    private static void ConfigureAggregates(ModelBuilder builder)
    {
        var aggregateRoots = builder
            .Model.GetEntityTypes()
            .Where(x => x.ClrType.IsAssignableTo(typeof(IAggregateRoot)));

        foreach (var entityType in aggregateRoots)
        {
            var entityBuilder = builder.Entity(entityType.ClrType).Ignore(nameof(IAggregateRoot.DomainEvents));
            entityBuilder.Property(nameof(Entity.CreateDate)).HasDefaultValueSql(EfConstants.DateAlgorithm);
            entityBuilder.Property(nameof(Entity.LastModifiedDate)).HasDefaultValueSql(EfConstants.DateAlgorithm);

            if (entityType.ClrType.IsAssignableTo(typeof(IEventSourcedAggregate)))
            {
                entityBuilder.Property(nameof(IEventSourcedAggregate.Version)).IsRowVersion();
            }
        }
    }
}
