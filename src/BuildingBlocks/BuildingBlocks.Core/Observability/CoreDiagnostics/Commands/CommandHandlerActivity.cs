using System.Diagnostics;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Observability.Diagnostics;

namespace BuildingBlocks.Core.Observability.CoreDiagnostics.Commands;

/// <summary>
/// Activity for command handler.
/// </summary>
public class CommandHandlerActivity(IDiagnosticsProvider diagnosticsProvider)
{
    /// <summary>
    /// Executes the action with activity.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The result of the action.</returns>
    public Task Execute<TCommand>(Func<Activity?, CancellationToken, Task> action, CancellationToken cancellationToken)
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

        // usually we use class/methodName
        var activityName = $"{ObservabilityConstant.Components.CommandHandler}.{commandHandlerName}/{commandName}";

        return diagnosticsProvider.ExecuteActivityAsync(
            new CreateActivityInfo
            {
                Name = activityName,
                ActivityKind = ActivityKind.Consumer,
                Tags = new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    { TelemetryTags.Tracing.Application.Commands.Command, commandName },
                    { TelemetryTags.Tracing.Application.Commands.CommandType, typeof(TCommand).FullName },
                    { TelemetryTags.Tracing.Application.Commands.CommandHandler, commandHandlerName },
                    { TelemetryTags.Tracing.Application.Commands.CommandHandlerType, handlerType?.FullName },
                },
            },
            action,
            cancellationToken
        );
    }

    /// <summary>
    /// Executes the action with activity.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The result of the action.</returns>
    public Task<TResult> Execute<TCommand, TResult>(
        Func<Activity?, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken
    )
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

        // usually we use class/methodName
        var activityName = $"{ObservabilityConstant.Components.CommandHandler}.{commandHandlerName}/{commandName}";

        return diagnosticsProvider.ExecuteActivityAsync(
            new CreateActivityInfo
            {
                Name = activityName,
                ActivityKind = ActivityKind.Consumer,
                Tags = new Dictionary<string, object?>
                {
                    { TelemetryTags.Tracing.Application.Commands.Command, commandName },
                    { TelemetryTags.Tracing.Application.Commands.CommandType, typeof(TCommand).FullName },
                    { TelemetryTags.Tracing.Application.Commands.CommandHandler, commandHandlerName },
                    { TelemetryTags.Tracing.Application.Commands.CommandHandlerType, handlerType?.FullName },
                },
            },
            action,
            cancellationToken
        );
    }
}
