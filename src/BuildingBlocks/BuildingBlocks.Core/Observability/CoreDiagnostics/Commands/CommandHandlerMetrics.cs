using System.Diagnostics;
using System.Diagnostics.Metrics;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Observability.Diagnostics;

namespace BuildingBlocks.Core.Observability.CoreDiagnostics.Commands;

/// <summary>
/// Metrics for command handlers.
/// </summary>
public class CommandHandlerMetrics(IDiagnosticsProvider diagnosticsProvider)
{
    private readonly UpDownCounter<long> _activeCommandsCounter = diagnosticsProvider.Meter.CreateUpDownCounter<long>(
        TelemetryTags.Metrics.Application.Commands.ActiveCount,
        unit: "{active_commands}",
        description: "Number of commands currently being handled"
    );
    private readonly Counter<long> _totalCommandsNumber = diagnosticsProvider.Meter.CreateCounter<long>(
        TelemetryTags.Metrics.Application.Commands.TotalExecutedCount,
        unit: "{total_commands}",
        description: "Total number of executed command that sent to command handlers"
    );
    private readonly Counter<long> _successCommandsNumber = diagnosticsProvider.Meter.CreateCounter<long>(
        TelemetryTags.Metrics.Application.Commands.SuccessCount,
        unit: "{success_commands}",
        description: "Number commands that handled successfully"
    );
    private readonly Counter<long> _failedCommandsNumber = diagnosticsProvider.Meter.CreateCounter<long>(
        TelemetryTags.Metrics.Application.Commands.FaildCount,
        unit: "{failed_commands}",
        description: "Number commands that handled with errors"
    );
    private readonly Histogram<double> _handlerDuration = diagnosticsProvider.Meter.CreateHistogram<double>(
        TelemetryTags.Metrics.Application.Commands.HandlerDuration,
        unit: "s",
        description: "Measures the duration of command handler"
    );

    private Stopwatch? _timer;

    /// <summary>
    /// Starts executing the command.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    public void StartExecuting<TCommand>()
    {
        var commandName = typeof(TCommand).Name;
        var handlerType = typeof(TCommand)
            .Assembly.GetTypes()
            .FirstOrDefault(t =>
                t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)
                        && i.GetGenericArguments()[0] == typeof(TCommand)
                    )
            );
        var commandHandlerName = handlerType?.Name;

        var tags = new TagList
        {
            { TelemetryTags.Tracing.Application.Commands.Command, commandName },
            { TelemetryTags.Tracing.Application.Commands.CommandType, typeof(TCommand).FullName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandler, commandHandlerName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandlerType, handlerType?.FullName },
        };

        if (_activeCommandsCounter.Enabled)
        {
            _activeCommandsCounter.Add(1, tags);
        }

        if (_totalCommandsNumber.Enabled)
        {
            _totalCommandsNumber.Add(1, tags);
        }

        _timer = Stopwatch.StartNew();
    }

    /// <summary>
    /// Finishes executing the command.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    public void FinishExecuting<TCommand>()
    {
        var commandName = typeof(TCommand).Name;
        var handlerType = typeof(TCommand)
            .Assembly.GetTypes()
            .FirstOrDefault(t =>
                t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)
                        && i.GetGenericArguments()[0] == typeof(TCommand)
                    )
            );
        var commandHandlerName = handlerType?.Name;

        var tags = new TagList
        {
            { TelemetryTags.Tracing.Application.Commands.Command, commandName },
            { TelemetryTags.Tracing.Application.Commands.CommandType, typeof(TCommand).FullName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandler, commandHandlerName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandlerType, handlerType?.FullName },
        };

        if (_activeCommandsCounter.Enabled)
        {
            _activeCommandsCounter.Add(-1, tags);
        }

        if (!_handlerDuration.Enabled)
        {
            return;
        }

        var elapsedTimeSeconds = _timer?.Elapsed.Seconds ?? 0;

        _handlerDuration.Record(elapsedTimeSeconds, tags);

        if (_successCommandsNumber.Enabled)
        {
            _successCommandsNumber.Add(1, tags);
        }
    }

    /// <summary>
    /// Marks the command as failed.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    public void FailedCommand<TCommand>()
    {
        var commandName = typeof(TCommand).Name;
        var handlerType = typeof(TCommand)
            .Assembly.GetTypes()
            .FirstOrDefault(t =>
                t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)
                        && i.GetGenericArguments()[0] == typeof(TCommand)
                    )
            );
        var commandHandlerName = handlerType?.Name;

        var tags = new TagList
        {
            { TelemetryTags.Tracing.Application.Commands.Command, commandName },
            { TelemetryTags.Tracing.Application.Commands.CommandType, typeof(TCommand).FullName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandler, commandHandlerName },
            { TelemetryTags.Tracing.Application.Commands.CommandHandlerType, handlerType?.FullName },
        };

        if (_failedCommandsNumber.Enabled)
        {
            _failedCommandsNumber.Add(1, tags);
        }
    }
}
