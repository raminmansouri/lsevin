using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;

/// <summary>
/// Represents the configuration for the process internalCommand job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ConfigureProcessInternalCommandJob"/> class.
/// </remarks>
/// <param name="moduleInformation">The module information.</param>
/// <param name="outboxOptions">The outbox options.</param>
internal sealed class ConfigureProcessInternalCommandJob(
    IModuleInformation moduleInformation,
    IOptions<InternalCommandOptions> outboxOptions
) : IConfigureOptions<QuartzOptions>
{
    private readonly InternalCommandOptions _internalCommandOptions = outboxOptions.Value;

    /// <inheritdoc />
    public void Configure(QuartzOptions options)
    {
        var jobName = $"{moduleInformation.Name}-{nameof(ProcessInternalCommandJob)}";
        var triggerName = $"{jobName}-trigger";

        options
            .AddJob<ProcessInternalCommandJob>(configure => configure.WithIdentity(jobName))
            .AddTrigger(configure =>
                configure
                    .ForJob(jobName)
                    .WithIdentity(triggerName)
                    .WithSimpleSchedule(schedule =>
                        schedule.WithIntervalInSeconds(_internalCommandOptions.IntervalInSeconds).RepeatForever()
                    )
            );
    }
}
