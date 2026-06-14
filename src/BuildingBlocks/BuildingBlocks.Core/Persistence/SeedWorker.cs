using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Persistence;

/// <summary>
/// This class is used to seed the database with initial data.
/// </summary>
/// <remarks>
/// In order to use this class, you must add a new class that implements <see cref="IDbSeeder"/>.
/// </remarks>
/// <param name="serviceScopeFactory">The service scope factory.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="logger">The logger.</param>
public sealed class SeedWorker(
    IServiceScopeFactory serviceScopeFactory,
    IModuleInformation moduleInformation,
    ILogger<SeedWorker> logger
) : IHostedService
{
    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("[SeedWorker] - Starting seeding for {ModuleName}...", moduleInformation.Name);

        await using var scope = serviceScopeFactory.CreateAsyncScope();
        var seeder = scope.ServiceProvider.GetService<IDbSeeder>();

        if (seeder is not null)
        {
            logger.LogInformation("[SeedWorker] - Seeding database for {ModuleName}...", moduleInformation.Name);
            await seeder.SeedAsync(cancellationToken);
            logger.LogInformation("[SeedWorker] - Database seeded for {ModuleName}!", moduleInformation.Name);
        }
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("[SeedWorker] - Stopping seeding for {ModuleName}...", moduleInformation.Name);

        return Task.CompletedTask;
    }
}
