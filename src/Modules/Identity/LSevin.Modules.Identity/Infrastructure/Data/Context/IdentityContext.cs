using System.Data;
using System.Reflection;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Persistence.EfCore.Postgres.Configurations;
using Humanizer;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class IdentityContext(DbContextOptions<IdentityContext> options)
    : IdentityDbContext<
        ApplicationUser,
        ApplicationRole,
        Guid,
        IdentityUserClaim<Guid>,
        ApplicationUserRole,
        IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>,
        IdentityUserToken<Guid>
    >(options),
        IBaseDbContext
{
    public const string DefaultSchema = "identity";

    public DbSet<PhoneLoginCode> PhoneLoginCodes => Set<PhoneLoginCode>();

    private IDbContextTransaction? _currentTransaction;

    public IDbContextTransaction? GetCurrentTransaction() => _currentTransaction;

    public bool HasActiveTransaction => _currentTransaction != null;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema(IdentityContext.DefaultSchema);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        builder.ApplyConfigurationsFromAssembly(typeof(StoredMessageConfiguration).Assembly);
        builder.ApplyConfigurationsFromAssembly(typeof(MessageConsumerConfiguration).Assembly);

        foreach (var entity in builder.Model.GetEntityTypes())
        {
            entity.SetTableName(entity.GetTableName()?.Underscore());

            var objectIdentifier = StoreObjectIdentifier.Table(
                entity.GetTableName()?.Underscore()!,
                entity.GetSchema()
            );

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(property.GetColumnName(objectIdentifier)?.Underscore());
            }

            foreach (var key in entity.GetKeys())
            {
                key.SetName(key.GetName()?.Underscore());
            }

            foreach (var key in entity.GetForeignKeys())
            {
                key.SetConstraintName(key.GetConstraintName()?.Underscore());
            }
        }
    }

    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        var saveResult = await SaveChangesAsync(cancellationToken);
        return saveResult > 0;
    }

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
}
