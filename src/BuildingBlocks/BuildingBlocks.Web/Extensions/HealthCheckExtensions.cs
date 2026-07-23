using Ardalis.GuardClauses;

using BuildingBlocks.Web.Constants;

using HealthChecks.UI.Client;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Extension methods for health checks.
/// </summary>
public static class HealthCheckExtensions
{
    /// <summary>
    /// Applies base health checks to the service collection.
    /// </summary>
    /// <param name="services">The IServiceCollection to add health checks to.</param>
    /// <param name="databaseConnectionString">The database connection string.</param>
    /// <param name="redisConnectionString">The redis connection string.</param>
    /// <param name="eventStoreConnectionString">The event store connection string.</param>
    /// <returns>The IServiceCollection.</returns>
    public static IServiceCollection AddBaseHealthCheck(
        this IServiceCollection services,
        string databaseConnectionString,
        string redisConnectionString,
        string eventStoreConnectionString
    )
    {
        Guard.Against.NullOrEmpty(databaseConnectionString, nameof(databaseConnectionString));
        Guard.Against.NullOrEmpty(redisConnectionString, nameof(redisConnectionString));
        Guard.Against.NullOrEmpty(eventStoreConnectionString, nameof(eventStoreConnectionString));

        services.AddRequestTimeouts(configure: static timeouts =>
            timeouts.AddPolicy(nameof(HealthChecks), TimeSpan.FromSeconds(5))
        );

        services.AddOutputCache(configureOptions: static caching =>
            caching.AddPolicy(
                nameof(HealthChecks),
                build: static policy => policy.Expire(TimeSpan.FromSeconds(10))
            )
        );

        services.AddHealthChecksUI().AddInMemoryStorage();

        services
            .AddHealthChecks()
            .AddNpgSql(databaseConnectionString)
            .AddRedis(redisConnectionString)
            .AddEventStore(eventStoreConnectionString)
            .AddCheck(
                WebConstants.HealthChecks.HealthCheckName,
                () => HealthCheckResult.Healthy(),
                tags: [WebConstants.HealthChecks.HealthCheckLiveTag]
            )
            .AddPingHealthCheck(
                _ => { },
                tags:
                [
                    WebConstants.HealthChecks.HealthCheckLiveTag,
                    WebConstants.HealthChecks.HealthCheckReadyTag,
                ]
            )
            .AddPrivateMemoryHealthCheck(
                512 * 1024 * 1024,
                tags:
                [
                    WebConstants.HealthChecks.HealthCheckLiveTag,
                    WebConstants.HealthChecks.HealthCheckReadyTag,
                ]
            )
            .AddDnsResolveHealthCheck(
                _ => { },
                tags:
                [
                    WebConstants.HealthChecks.HealthCheckLiveTag,
                    WebConstants.HealthChecks.HealthCheckReadyTag,
                ]
            )
            .AddDiskStorageHealthCheck(
                _ => { },
                tags:
                [
                    WebConstants.HealthChecks.HealthCheckLiveTag,
                    WebConstants.HealthChecks.HealthCheckReadyTag,
                ]
            );

        return services;
    }

    /// <summary>
    /// Maps health check endpoints.
    /// Liveness and readiness probes are always available, including Production.
    /// Detailed health output remains Development-only.
    /// </summary>
    /// <param name="app">The <see cref="WebApplication"/> instance to configure.</param>
    public static void MapHealthCheckEndPoints(this WebApplication app)
    {
        app.MapHealthChecks(
                WebConstants.HealthChecks.HealthCheckLive,
                new HealthCheckOptions
                {
                    Predicate = registration =>
                        registration.Tags.Contains(WebConstants.HealthChecks.HealthCheckLiveTag),
                }
            )
            .WithRequestTimeout(nameof(HealthChecks));

        app.MapHealthChecks(
                WebConstants.HealthChecks.HealthCheckReady,
                new HealthCheckOptions
                {
                    Predicate = registration =>
                        registration.Tags.Contains(WebConstants.HealthChecks.HealthCheckReadyTag),
                }
            )
            .WithRequestTimeout(nameof(HealthChecks));

        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        app.MapHealthChecks(
                WebConstants.HealthChecks.HealthCheck,
                new HealthCheckOptions
                {
                    Predicate = _ => true,
                    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                }
            )
            .WithRequestTimeout(nameof(HealthChecks));

        app.MapHealthChecks(
                WebConstants.HealthChecks.HealthCheckUI,
                new HealthCheckOptions
                {
                    Predicate = _ => true,
                    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
                }
            )
            .WithRequestTimeout(nameof(HealthChecks));
    }
}