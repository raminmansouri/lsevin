using System.Diagnostics;
using BuildingBlocks.Core.Observability;
using BuildingBlocks.Core.Observability.Extensions;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Resiliency.Options;
using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polly.Registry;

namespace BuildingBlocks.Core.Persistence;

/// <summary>
/// This class is used to migration the database with initial data.
/// </summary>
/// <remarks>
/// In order to use this class, you must add a new class that implements <see cref="IDbMigrator"/>.
/// </remarks>
/// <param name="serviceScopeFactory">The service scope factory.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="logger">The logger.</param>
public sealed class MigrationWorker(
    IServiceScopeFactory serviceScopeFactory,
    IModuleInformation moduleInformation,
    ILogger<MigrationWorker> logger
) : IHostedService
{
    private static readonly ActivitySource _activitySource = new(ObservabilityConstant.ActivitySourceNames.Migration);

    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("[MigrationWorker] - Starting migration for {ModuleName}...", moduleInformation.Name);

        using var activity = _activitySource.StartActivity();

        await using var scope = serviceScopeFactory.CreateAsyncScope();
        var migrator = scope.ServiceProvider.GetService<IDbMigrator>();
        var retryProvider = scope.ServiceProvider.GetRequiredService<ResiliencePipelineProvider<string>>();

        if (migrator is not null)
        {
            try
            {
                logger.LogInformation(
                    "[MigrationWorker] - Migrating database for {ModuleName}...",
                    moduleInformation.Name
                );
                await retryProvider
                    .GetPipeline(nameof(ResiliencyType.Shared))
                    .ExecuteAsync(async ct => await migrator.MigrateAsync(ct), cancellationToken);
                logger.LogInformation(
                    "[MigrationWorker] - Database Migrated for {ModuleName}!",
                    moduleInformation.Name
                );
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "[MigrationWorker] - An error occurred while migrating the database for {ModuleName}",
                    moduleInformation.Name
                );
                activity?.SetExceptionTags(ex);

                throw;
            }
        }
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("[MigrationWorker] - Stopping migration for {ModuleName}...", moduleInformation.Name);

        return Task.CompletedTask;
    }
}
