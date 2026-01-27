using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Quartz;

namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the service provider extensions.
/// </summary>
public static class ServiceProviderExtensions
{
    /// <summary>
    /// Starts the hosted services.
    /// </summary>
    /// <param name="serviceProvider">The service provider.</param>
    /// <param name="waitForJobsToComplete">Whether to wait for Quartz jobs to complete when stopping.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <param name="hostedServiceTypes">The hosted service types.</param>
    /// <returns>The task object representing the asynchronous operation.</returns>
    public static Task StartHostedServices(
        this IServiceProvider serviceProvider,
        bool waitForJobsToComplete = true,
        CancellationToken cancellationToken = default,
        params Type[] hostedServiceTypes
    )
    {
        IEnumerable<IHostedService> hostedServices = serviceProvider.GetServices<IHostedService>();
        return Task.WhenAll(
            hostedServices.Select(async s =>
            {
                if (hostedServiceTypes.Length == 0)
                {
                    await s.StartAsync(cancellationToken);
                    return Task.CompletedTask;
                }

                return Task.CompletedTask;
            })
        );
    }

    /// <summary>
    /// Stops the hosted services.
    /// </summary>
    /// <param name="serviceProvider">The service provider.</param>
    /// <param name="waitForJobsToComplete">Whether to wait for Quartz jobs to complete when stopping.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <param name="hostedServiceTypes">The hosted service types.</param>
    /// <returns>The task object representing the asynchronous operation.</returns>
    public static async Task StopHostedServices(
        this IServiceProvider serviceProvider,
        bool waitForJobsToComplete = true,
        CancellationToken cancellationToken = default,
        params Type[] hostedServiceTypes
    )
    {
        IEnumerable<IHostedService> hostedServices = serviceProvider.GetServices<IHostedService>();

        // Then stop other hosted services
        await Task.WhenAll(
                hostedServices.Select(s =>
                {
                    if (
                        hostedServiceTypes.Length == 0
                    )
                        return s.StopAsync(cancellationToken);

                    return Task.CompletedTask;
                })
            )
            .ConfigureAwait(false);
    }
}
