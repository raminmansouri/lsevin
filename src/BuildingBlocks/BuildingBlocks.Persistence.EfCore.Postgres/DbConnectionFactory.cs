using System.Data;
using System.Data.Common;
using BuildingBlocks.Core.Persistence.Connection;
using Npgsql;

namespace BuildingBlocks.Persistence.EfCore.Postgres;

/// <summary>
/// Factory for creating and managing SQL connections.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="DbConnectionFactory"/> class.
/// </remarks>
/// <param name="connectionString">The connection string.</param>
internal sealed class DbConnectionFactory(string connectionString) : IDbConnectionFactory, IDisposable, IAsyncDisposable
{
    private volatile bool _disposedValue;
    private NpgsqlConnection? _connection;

    /// <inheritdoc />
    public DbConnection GetOrCreateConnection()
    {
        if (_connection is { State: ConnectionState.Open })
        {
            return _connection;
        }

        _connection = new NpgsqlConnection(connectionString);
        _connection.Open();

        return _connection;
    }

    /// <inheritdoc />
    public async ValueTask<DbConnection> GetOrCreateConnectionAsync(CancellationToken cancellationToken = default)
    {
        if (_connection is { State: ConnectionState.Open })
        {
            return _connection;
        }

        _connection = new NpgsqlConnection(connectionString);
        await _connection.OpenAsync(cancellationToken);

        return _connection;
    }

    #region Dispose

    /// <summary>
    /// Disposes the resources used by the <see cref="DbConnectionFactory"/> class.
    /// </summary>
    /// <param name="disposing">A value indicating whether the object is being disposed.</param>
    private void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                if (_connection is { State: ConnectionState.Open })
                {
                    _connection.Dispose();
                }
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Disposes the resources used by the <see cref="DbConnectionFactory"/> class.
    /// </summary>
    /// <param name="disposing">A value indicating whether the object is being disposed.</param>
    private async Task DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                if (_connection is { State: ConnectionState.Open })
                {
                    await _connection.DisposeAsync();
                }
            }

            _disposedValue = true;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    #endregion
}
