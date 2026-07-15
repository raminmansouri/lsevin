using System.Data.Common;
using BuildingBlocks.Core.Persistence.Connection;
using Npgsql;

namespace BuildingBlocks.Persistence.EfCore.Postgres;

/// <summary>
/// Factory for creating SQL connections.
/// </summary>
/// <remarks>
/// Each call returns a FRESH connection (Npgsql connection pooling makes this
/// cheap). Returning a single shared/cached connection is unsafe: NpgsqlConnection
/// is not thread-safe, and a nested caller that does <c>await using</c> on the
/// shared connection (e.g. CurrencyService inside a provider query) would dispose
/// it out from under the outer handler -> "Cannot access a disposed object:
/// NpgsqlConnection". Connections handed out are tracked and disposed when this
/// (scoped) factory is disposed, so callers that don't dispose their own do not leak.
/// </remarks>
/// <param name="connectionString">The connection string.</param>
internal sealed class DbConnectionFactory(string connectionString) : IDbConnectionFactory, IDisposable, IAsyncDisposable
{
    private readonly List<NpgsqlConnection> _connections = [];
    private bool _disposed;

    /// <inheritdoc />
    public DbConnection GetOrCreateConnection()
    {
        var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        Track(connection);
        return connection;
    }

    /// <inheritdoc />
    public async ValueTask<DbConnection> GetOrCreateConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        Track(connection);
        return connection;
    }

    private void Track(NpgsqlConnection connection)
    {
        lock (_connections)
        {
            _connections.Add(connection);
        }
    }

    #region Dispose

    /// <inheritdoc />
    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        NpgsqlConnection[] toDispose;
        lock (_connections)
        {
            toDispose = [.. _connections];
            _connections.Clear();
        }

        foreach (var connection in toDispose)
        {
            connection.Dispose();
        }

        GC.SuppressFinalize(this);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        NpgsqlConnection[] toDispose;
        lock (_connections)
        {
            toDispose = [.. _connections];
            _connections.Clear();
        }

        foreach (var connection in toDispose)
        {
            await connection.DisposeAsync();
        }

        GC.SuppressFinalize(this);
    }

    #endregion
}
