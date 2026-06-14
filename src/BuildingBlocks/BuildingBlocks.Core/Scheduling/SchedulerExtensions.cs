using Ardalis.GuardClauses;
using BuildingBlocks.Core.Generators;
using Microsoft.Extensions.DependencyInjection;
using Quartz;

namespace BuildingBlocks.Core.Scheduling;

/// <summary>
/// Provides extension methods for registering Quartz services.
/// </summary>
public static class SchedulerExtensions
{
    private const string DefaultSchedulerId = "default-id";
    private const string DefaultSchedulerName = "default-name";

    /// <summary>
    /// Adds the base job registration to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="configure">The configuration action.</param>
    /// <returns>The <see cref="IServiceCollection"/> so that additional calls can be chained.</returns>
    public static IServiceCollection AddScheduler(
        this IServiceCollection services,
        Action<IServiceCollectionQuartzConfigurator>? configure = null
    )
    {
        services.AddQuartz(configurator =>
        {
            var scheduler = IdGenerator.NewId();
            configurator.SchedulerId = $"{DefaultSchedulerId}-{scheduler}";
            configurator.SchedulerName = $"{DefaultSchedulerName}-{scheduler}";

            configure?.Invoke(configurator);
        });

        services.AddQuartzHostedService(options =>
        {
            options.WaitForJobsToComplete = true;
            options.AwaitApplicationStarted = true;
        });

        services.AddJobScheduler();

        return services;
    }

    /// <summary>
    /// Adds the job scheduler to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <returns>The <see cref="IServiceCollection"/> so that additional calls can be chained.</returns>
    public static IServiceCollection AddJobScheduler(this IServiceCollection services)
    {
        return services.AddScoped<IJobScheduler, JobScheduler>();
    }

    /// <summary>
    /// Represents the job execution context extensions.
    /// </summary>
    /// <param name="context">The job execution context.</param>
    /// <param name="key">The key.</param>
    /// <returns>The job data value.</returns>
    public static string GetJobDataValue(this IJobExecutionContext context, string key)
    {
        var value = context.JobDetail.JobDataMap.GetString(key);
        return Guard.Against.NullOrEmpty(value, nameof(value));
    }
}
