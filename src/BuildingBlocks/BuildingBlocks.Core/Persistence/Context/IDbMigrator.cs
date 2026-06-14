namespace BuildingBlocks.Core.Persistence.Context;

/// <summary>
/// Interface for database migrator.
/// </summary>
public interface IDbMigrator
{
    /// <summary>
    /// Asynchronously migrator the database.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>
    Task MigrateAsync(CancellationToken cancellationToken = default);
}
