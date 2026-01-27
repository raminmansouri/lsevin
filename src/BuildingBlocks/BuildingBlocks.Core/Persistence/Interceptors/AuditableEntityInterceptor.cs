using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.Primitives;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BuildingBlocks.Core.Persistence.Interceptors;

/// <summary>
/// Represents the interceptor that updates the auditable entities.
/// </summary>
public sealed class AuditableEntityInterceptor : SaveChangesInterceptor
{
    #region Constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="AuditableEntityInterceptor"/> class.
    /// </summary>
    public AuditableEntityInterceptor() { }

    #endregion

    /// <inheritdoc />
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default
    )
    {
        if (eventData.Context is not null)
        {
            UpdateEntities(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>
    /// Updates the entities.
    /// </summary>
    /// <param name="context">The database context.</param>
    private static void UpdateEntities(DbContext context)
    {
        foreach (var entry in context.ChangeTracker.Entries<IEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.SetCreateDate(SystemClock.Now);
            }

            if (
                entry.State == EntityState.Added
                || entry.State == EntityState.Modified
                || entry.HasChangedOwnedEntities()
            )
            {
                entry.Entity.SetModifiedDate(SystemClock.Now);
            }
        }
    }
}

/// <summary>
/// Extension methods for <see cref="EntityEntry"/>.
/// </summary>
public static class Extensions
{
    /// <summary>
    /// Checks if the entity entry has changed owned entities.
    /// </summary>
    /// <param name="entry">The entity entry.</param>
    /// <returns>True if the entity entry has changed owned entities; otherwise, false.</returns>
    public static bool HasChangedOwnedEntities(this EntityEntry entry) =>
        entry.References.Any(r =>
            r.TargetEntry?.Metadata.IsOwned() == true
            && r.TargetEntry.State is EntityState.Added or EntityState.Modified
        );
}
