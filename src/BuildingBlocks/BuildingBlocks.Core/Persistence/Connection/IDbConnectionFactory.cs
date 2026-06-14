using System.Data.Common;

namespace BuildingBlocks.Core.Persistence.Connection;

/// <summary>
/// Provides an interface for obtaining an open SQL connection.
/// </summary>
public interface IDbConnectionFactory
{
    /// <summary>
    /// Obtains and returns an open SQL connection.
    /// </summary>
    /// <returns>An open SqlConnection object.</returns>
    DbConnection GetOrCreateConnection();

    /// <summary>
    /// Obtains and returns an open SQL connection.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the open SQL connection.</returns>
    ValueTask<DbConnection> GetOrCreateConnectionAsync(CancellationToken cancellationToken = default);
}
