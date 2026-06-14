using System.Diagnostics;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Observability.Diagnostics;

namespace BuildingBlocks.Core.Observability.CoreDiagnostics.Query;

/// <summary>
/// Activity for query handler.
/// </summary>
public class QueryHandlerActivity(IDiagnosticsProvider diagnosticsProvider)
{
    /// <summary>
    /// Executes the action with activity.
    /// </summary>
    /// <typeparam name="TQuery">The type of the query.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The result of the action.</returns>
    public Task<TResult> Execute<TQuery, TResult>(
        Func<Activity?, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken
    )
    {
        var queryName = typeof(TQuery).Name;
        var handlerType = typeof(TQuery)
            .Assembly.GetTypes()
            .FirstOrDefault(t =>
                t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(IQueryHandler<,>)
                        && i.GetGenericArguments()[0] == typeof(TQuery)
                    )
            );
        var queryHandlerName = handlerType?.Name;

        // usually we use class/methodName
        var activityName = $"{ObservabilityConstant.Components.QueryHandler}.{queryHandlerName}/{queryName}";

        return diagnosticsProvider.ExecuteActivityAsync(
            new CreateActivityInfo
            {
                Name = activityName,
                ActivityKind = ActivityKind.Consumer,
                Tags = new Dictionary<string, object?>
                {
                    { TelemetryTags.Tracing.Application.Queries.Query, queryName },
                    { TelemetryTags.Tracing.Application.Queries.QueryType, typeof(TQuery).FullName },
                    { TelemetryTags.Tracing.Application.Queries.QueryHandler, queryHandlerName },
                    { TelemetryTags.Tracing.Application.Queries.QueryHandlerType, handlerType?.FullName },
                },
            },
            action,
            cancellationToken
        );
    }
}
