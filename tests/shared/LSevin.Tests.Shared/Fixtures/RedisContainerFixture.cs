using BuildingBlocks.Core.Generators;
using LSevin.Tests.Shared.Helpers;
using StackExchange.Redis;
using Testcontainers.Redis;
using Xunit.Sdk;

namespace LSevin.Tests.Shared.Fixtures;

/// <summary>
/// Represents a Redis container fixture.
/// </summary>
public class RedisContainerFixture : IAsyncLifetime
{
    /// <summary>
    /// Gets the tcp container port.
    /// </summary>
    private static int TcpContainerPort => RedisBuilder.RedisPort;

    /// <summary>
    /// Gets the message sink.
    /// </summary>
    private readonly IMessageSink _messageSink;

    /// <summary>
    /// Gets the host port.
    /// </summary>
    public int HostPort => Container.GetMappedPublicPort(RedisBuilder.RedisPort);

    /// <summary>
    /// Gets the Redis container options.
    /// </summary>
    public RedisContainerOptions RedisContainerOptions { get; }

    /// <summary>
    /// Gets the container.
    /// </summary>
    public RedisContainer Container { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="RedisContainerFixture"/> class.
    /// </summary>
    /// <param name="messageSink">The message sink.</param>
    public RedisContainerFixture(IMessageSink messageSink)
    {
        _messageSink = messageSink;
        RedisContainerOptions = ConfigurationHelper.BindOptions<RedisContainerOptions>();
        ArgumentNullException.ThrowIfNull(RedisContainerOptions);

        var redisContainerBuilder = new RedisBuilder()
            .WithCleanUp(true)
            .WithName(RedisContainerOptions.Name)
            .WithImage(RedisContainerOptions.ImageName);

        Container = redisContainerBuilder.Build();
    }

    /// <summary>
    /// Cleans up all keys in Redis.
    /// </summary>
    public async Task CleanupAsync()
    {
        try
        {
            var connection = await ConnectionMultiplexer.ConnectAsync(Container.GetConnectionString());
            var database = connection.GetDatabase();

            var endpoints = connection.GetEndPoints();
            foreach (var endpoint in endpoints)
            {
                var server = connection.GetServer(endpoint);
                await foreach (var key in server.KeysAsync())
                {
                    await database.KeyDeleteAsync(key);
                }
            }

            await connection.CloseAsync();
        }
        catch (Exception e)
        {
            _messageSink.OnMessage(new DiagnosticMessage(e.Message));
        }
    }

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        await Container.StartAsync();
        _messageSink.OnMessage(
            new DiagnosticMessage(
                $"Redis fixture started on Host port {HostPort} and container tcp port {TcpContainerPort}..."
            )
        );
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await Container.StopAsync();
        await Container.DisposeAsync();
        _messageSink.OnMessage(new DiagnosticMessage("Redis fixture stopped."));
    }
}

/// <summary>
/// Represents the Redis container options.
/// </summary>
public sealed class RedisContainerOptions
{
    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    public string Name { get; set; } = "redis_test_" + IdGenerator.NewId();

    /// <summary>
    /// Gets or sets the image name.
    /// </summary>
    public string ImageName { get; set; } = "redis:latest";
}
