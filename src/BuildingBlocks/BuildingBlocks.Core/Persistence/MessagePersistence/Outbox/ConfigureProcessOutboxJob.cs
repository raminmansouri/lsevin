using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the configuration for the process outbox job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ConfigureProcessOutboxJob"/> class.
/// </remarks>
/// <param name="moduleInformation">The module information.</param>
/// <param name="outboxOptions">The outbox options.</param>
internal sealed class ConfigureProcessOutboxJob(
    IModuleInformation moduleInformation,
    IOptions<OutboxOptions> outboxOptions
) : IConfigureOptions<QuartzOptions>
{
    private readonly OutboxOptions _outboxOptions = outboxOptions.Value;

    /// <inheritdoc />
    public void Configure(QuartzOptions options)
    {
        var jobName = $"{moduleInformation.Name}-{nameof(ProcessOutboxJob)}";

        options
            .AddJob<ProcessOutboxJob>(configure => configure.WithIdentity(jobName))
            .AddTrigger(configure =>
                configure
                    .ForJob(jobName)
                    .WithSimpleSchedule(schedule =>
                        schedule.WithIntervalInSeconds(_outboxOptions.IntervalInSeconds).RepeatForever()
                    )
            );
    }
}
