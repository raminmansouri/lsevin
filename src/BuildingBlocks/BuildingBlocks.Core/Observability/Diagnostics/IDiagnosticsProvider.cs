using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace BuildingBlocks.Core.Observability.Diagnostics;

/// <summary>
/// Represents the diagnostics provider.
/// </summary>
public interface IDiagnosticsProvider : IDisposable
{
    /// <summary>
    /// Gets the instrumentation name.
    /// </summary>
    string InstrumentationName { get; }

    /// <summary>
    /// Gets the activity source.
    /// </summary>
    ActivitySource ActivitySource { get; }

    /// <summary>
    /// Gets the meter.
    /// </summary>
    Meter Meter { get; }

    /// <summary>
    /// Executes the action with activity.
    /// </summary>
    /// <param name="createActivityInfo">The create activity information.</param>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The result of the action.</returns>
    Task ExecuteActivityAsync(
        CreateActivityInfo createActivityInfo,
        Func<Activity?, CancellationToken, Task> action,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Executes the action with activity.
    /// </summary>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="createActivityInfo">The create activity information.</param>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The result of the action.</returns>
    Task<TResult> ExecuteActivityAsync<TResult>(
        CreateActivityInfo createActivityInfo,
        Func<Activity?, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default
    );
}
