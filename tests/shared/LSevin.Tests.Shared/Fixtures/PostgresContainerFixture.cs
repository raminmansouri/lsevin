using Ardalis.GuardClauses;
using BuildingBlocks.Core.Generators;
using Dapper;
using LSevin.Tests.Shared.Helpers;
using Npgsql;
using Respawn;
using Testcontainers.PostgreSql;
using Xunit.Sdk;

namespace LSevin.Tests.Shared.Fixtures;

/// <summary>
/// Represents a sql container fixture.
/// </summary>
public class PostgresContainerFixture : IAsyncLifetime
{
    private readonly IMessageSink _messageSink;
    public PostgresContainerOptions PostgresContainerOptions { get; }
    public PostgreSqlContainer Container { get; }
    public int HostPort => Container.GetMappedPublicPort(PostgreSqlBuilder.PostgreSqlPort);
    public static int TcpContainerPort => PostgreSqlBuilder.PostgreSqlPort;

    /// <summary>
    /// Initializes a new instance of the <see cref="PostgresContainerFixture"/> class.
    /// </summary>
    /// <param name="messageSink">The message sink.</param>
    public PostgresContainerFixture(IMessageSink messageSink)
    {
        _messageSink = messageSink;
        PostgresContainerOptions = ConfigurationHelper.BindOptions<PostgresContainerOptions>();
        Guard.Against.Null(PostgresContainerOptions);

        var postgresContainerBuilder = new PostgreSqlBuilder()
            .WithDatabase(PostgresContainerOptions.DatabaseName)
            .WithCleanUp(true)
            .WithName(PostgresContainerOptions.Name)
            .WithImage(PostgresContainerOptions.ImageName);

        Container = postgresContainerBuilder.Build();
    }

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        await Container.StartAsync();
        _messageSink.OnMessage(
            new DiagnosticMessage(
                $"Postgres fixture started on Host port {HostPort} and container tcp port {TcpContainerPort}..."
            )
        );
    }

    /// <summary>
    /// Resets the database.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ResetDbAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new NpgsqlConnection(Container.GetConnectionString());
            await connection.OpenAsync(cancellationToken);
            // after new nugget version respawn than 6 according this https://github.com/jbogard/Respawn/pull/115 pull request we don't need this check and should remove
            await CheckForExistingDatabase(connection, cancellationToken);

            var checkpoint = await Respawner.CreateAsync(
                connection,
                new RespawnerOptions { DbAdapter = DbAdapter.Postgres }
            );
            //TODO: should update to latest version after release a new version
            // https://github.com/jbogard/Respawn/issues/108
            // https://github.com/jbogard/Respawn/pull/115 - fixed
            // waiting for new nuget version of respawn, current is 6.
            await checkpoint.ResetAsync(connection);
        }
        catch (Exception e)
        {
            _messageSink.OnMessage(new DiagnosticMessage(e.Message));
        }
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await Container.StopAsync();
        await Container.DisposeAsync(); //important for the event to clean up to be fired!
        _messageSink.OnMessage(new DiagnosticMessage("Postgres fixture stopped."));
    }

    /// <summary>
    /// Checks for existing database(should replace master with db name).
    /// </summary>
    /// <param name="connection">The connection.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CheckForExistingDatabase(
        NpgsqlConnection connection,
        CancellationToken cancellationToken = default
    )
    {
        var existsDb = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                $"""SELECT 1 FROM  pg_catalog.pg_database WHERE datname= @dbname""",
                new { dbname = PostgresContainerOptions.DatabaseName },
                cancellationToken: cancellationToken
            )
        );
        if (existsDb == false)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    "CREATE DATABASE @DBName",
                    new { DBName = PostgresContainerOptions.DatabaseName },
                    cancellationToken: cancellationToken
                )
            );
        }
    }
}

/// <summary>
/// Represents the sql container options.
/// </summary>
public sealed class PostgresContainerOptions
{
    public string Name { get; set; } = "postgres_" + IdGenerator.NewId();
    public string ImageName { get; set; } = "postgres:latest";
    public string DatabaseName { get; set; } = "test_db";
}
