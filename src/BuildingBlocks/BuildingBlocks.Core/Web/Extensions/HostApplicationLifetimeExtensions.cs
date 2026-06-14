using Microsoft.Extensions.Hosting;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Represents the host application lifetime extensions.
/// </summary>
public static class HostApplicationLifetimeExtensions
{
    /// <summary>
    /// Waits for the application to start.
    /// </summary>
    /// <param name="lifetime">The lifetime.</param>
    /// <param name="stoppingToken">The stopping token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public static async Task<bool> WaitForAppStartup(
        this IHostApplicationLifetime lifetime,
        CancellationToken stoppingToken
    )
    {
        var startedSource = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var cancelledSource = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        await using var reg1 = lifetime.ApplicationStarted.Register(() => startedSource.SetResult());
        await using var reg2 = stoppingToken.Register(() => cancelledSource.SetResult());

        Task completedTask = await Task.WhenAny(startedSource.Task, cancelledSource.Task).ConfigureAwait(false);

        // If the completed tasks was the "app started" task, return true, otherwise false
        return completedTask == startedSource.Task;
    }
}
