namespace BuildingBlocks.Core.Persistence.Context;

/// <summary>
/// Interface for database seeders.
/// </summary>
public interface IDbSeeder
{
    /// <summary>
    /// Asynchronously seeds the database.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>
    Task SeedAsync(CancellationToken cancellationToken = default);
}
