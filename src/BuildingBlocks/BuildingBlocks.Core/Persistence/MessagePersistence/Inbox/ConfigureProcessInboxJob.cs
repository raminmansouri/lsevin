using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Represents the configuration for the process inbox job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ConfigureProcessInboxJob"/> class.
/// </remarks>
/// <param name="moduleInformation">The module information.</param>
/// <param name="outboxOptions">The outbox options.</param>
internal sealed class ConfigureProcessInboxJob(
    IModuleInformation moduleInformation,
    IOptions<InboxOptions> outboxOptions
) : IConfigureOptions<QuartzOptions>
{
    private readonly InboxOptions _inboxOptions = outboxOptions.Value;

    /// <inheritdoc />
    public void Configure(QuartzOptions options)
    {
        var jobName = $"{moduleInformation.Name}-{nameof(ProcessInboxJob)}";

        options
            .AddJob<ProcessInboxJob>(configure => configure.WithIdentity(jobName))
            .AddTrigger(configure =>
                configure
                    .ForJob(jobName)
                    .WithSimpleSchedule(schedule =>
                        schedule.WithIntervalInSeconds(_inboxOptions.IntervalInSeconds).RepeatForever()
                    )
            );
    }
}
