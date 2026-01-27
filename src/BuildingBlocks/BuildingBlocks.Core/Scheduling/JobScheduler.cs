using Microsoft.Extensions.Logging;
using Quartz;

namespace BuildingBlocks.Core.Scheduling;

/// <summary>
/// Implementation of the job scheduler.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="JobScheduler"/> class.
/// </remarks>
/// <param name="schedulerFactory">The scheduler factory.</param>
/// <param name="logger">The logger.</param>
public sealed class JobScheduler(ISchedulerFactory schedulerFactory, ILogger<JobScheduler> logger) : IJobScheduler
{
    /// <summary>
    /// Schedules a job.
    /// </summary>
    /// <typeparam name="TJob">The type of the job.</typeparam>
    /// <param name="jobKey">The job key.</param>
    /// <param name="jobData">The job data.</param>
    /// <param name="runImmediately">Whether to run the job immediately.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ScheduleJobAsync<TJob>(
        JobKey jobKey,
        IDictionary<string, string> jobData,
        bool runImmediately = true,
        CancellationToken cancellationToken = default
    )
        where TJob : IJob
    {
        try
        {
            var scheduler = await schedulerFactory.GetScheduler(cancellationToken);

            var jobBuilder = JobBuilder.Create<TJob>().WithIdentity(jobKey);

            // Add job data
            foreach (var (key, value) in jobData)
            {
                jobBuilder.UsingJobData(key, value);
            }

            var job = jobBuilder.Build();

            // Create a trigger
            var triggerKey = new TriggerKey($"{jobKey.Name}_trigger");
            var triggerBuilder = TriggerBuilder.Create().WithIdentity(triggerKey);

            if (runImmediately)
            {
                triggerBuilder.StartNow();
            }
            else
            {
                triggerBuilder.StartAt(DateBuilder.FutureDate(1, IntervalUnit.Second));
            }

            var trigger = triggerBuilder.Build();

            // Schedule the job
            await scheduler.ScheduleJob(job, trigger, cancellationToken);

            logger.LogInformation(
                "[ScheduleJob] - Scheduled job {JobType} with key {JobKey}",
                typeof(TJob).Name,
                jobKey
            );
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "[ScheduleJob] - Error scheduling job {JobType} with key {JobKey}",
                typeof(TJob).Name,
                jobKey
            );
            throw;
        }
    }
}
