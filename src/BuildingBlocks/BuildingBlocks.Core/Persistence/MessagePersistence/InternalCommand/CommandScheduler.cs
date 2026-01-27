using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;
using BuildingBlocks.Core.Web.Module;
using Dapper;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;

/// <summary>
/// Represents the command scheduler.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="CommandScheduler"/> class.
/// </remarks>
/// <param name="dbConnectionFactory">The database connection factory.</param>
/// <param name="serializer">The serializer.</param>
/// <param name="moduleInformation">The module information.</param>
internal sealed class CommandScheduler(
    IDbConnectionFactory dbConnectionFactory,
    ISerializer serializer,
    IModuleInformation moduleInformation
) : ICommandScheduler
{
    /// <inheritdoc />
    public async Task EnqueueAsync<T>(ICommand<T> command, CancellationToken cancellationToken = default)
        where T : notnull
    {
        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        var internalCommand = new InternalCommandMessage(
            command.Id,
            Type: TypeMapper.GetTypeName(command.GetType()),
            Content: serializer.Serialize(command, camelCase: false),
            OccurredOnUtc: SystemClock.Now
        );

        string sql = $"""
                INSERT INTO {moduleInformation.Schema}.internal_command_messages(id, type, occurred_on_utc)
                VALUES (@Id, @Type, @OccurredOnUtc)
            """;

        await connection
            .ExecuteAsync(new CommandDefinition(sql, internalCommand, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task EnqueueAsync<T>(IEnumerable<ICommand<T>> commands, CancellationToken cancellationToken = default)
        where T : notnull
    {
        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        var internalCommands = commands.Select(command => new
        {
            moduleInformation.Schema,
            command.Id,
            Type = TypeMapper.GetTypeName(command.GetType()),
            Content = serializer.Serialize(command, camelCase: false),
            OccurredOnUtc = SystemClock.Now,
        });

        string sql = $"""
                INSERT INTO {moduleInformation.Schema}.internal_command_messages(id, type, occurred_on_utc)
                VALUES (@Id, @Type, @OccurredOnUtc)
            """;

        await connection
            .ExecuteAsync(new CommandDefinition(sql, internalCommands, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }
}
