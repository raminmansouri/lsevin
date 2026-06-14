using System.Diagnostics;
using BuildingBlocks.Core.Observability;
using BuildingBlocks.Core.Observability.Extensions;
using BuildingBlocks.Core.Resiliency.Options;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly.Registry;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Provides extension methods for database context migration.
/// </summary>
public static class MigrateDbContextExtensions
{
    internal static readonly string ActivitySourceName = "DbMigrations";
    internal static readonly ActivitySource ActivitySource = new(ActivitySourceName);

    /// <summary>
    /// Adds a database migration service.
    /// </summary>
    /// <typeparam name="TContext">The DbContext type.</typeparam>
    /// <param name="app">The application builder.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    public static async Task ApplyDatabaseMigrations<TContext>(
        this IApplicationBuilder app,
        CancellationToken cancellationToken = default
    )
        where TContext : DbContext
    {
        await using var scope = app.ApplicationServices.CreateAsyncScope();
        var scopeServices = scope.ServiceProvider;
        var logger = scopeServices.GetRequiredService<ILogger<TContext>>();
        var context = scopeServices.GetService<TContext>();
        ArgumentNullException.ThrowIfNull(context);
        var retryProvider = scopeServices.GetRequiredService<ResiliencePipelineProvider<string>>();

        using var activity = ActivitySource.StartActivity(name: ObservabilityConstant.ActivitySourceNames.Migration);

        var retry = retryProvider.GetPipeline(nameof(ResiliencyType.Shared));

        try
        {
            logger.LogInformation(
                "[Migration] - Migrating database associated with context {DbContextName}",
                typeof(TContext).Name
            );

            await retry.ExecuteAsync(async ct => await context.Database.MigrateAsync(ct), cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "[Migration] - An error occurred while migrating the database used on context {DbContextName}",
                typeof(TContext).Name
            );

            activity?.SetExceptionTags(ex);

            throw;
        }
    }
}
