using Quartz;

namespace BuildingBlocks.Core.Scheduling;

/// <summary>
/// Interface for scheduling jobs.
/// </summary>
public interface IJobScheduler
{
    /// <summary>
    /// Schedules a job to run.
    /// </summary>
    /// <typeparam name="TJob">The type of job to schedule.</typeparam>
    /// <param name="jobKey">The key to identify the job.</param>
    /// <param name="jobData">The data to pass to the job.</param>
    /// <param name="runImmediately">Whether to run the job immediately or not.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task ScheduleJobAsync<TJob>(
        JobKey jobKey,
        IDictionary<string, string> jobData,
        bool runImmediately = true,
        CancellationToken cancellationToken = default
    )
        where TJob : IJob;
}
