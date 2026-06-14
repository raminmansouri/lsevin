using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Reflection;
using BuildingBlocks.Core.Observability.Extensions;
using BuildingBlocks.Core.Observability.Options;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.Observability.Diagnostics;

/// <summary>
/// Represents the diagnostics provider.
/// </summary>
public class DiagnosticsProvider(IMeterFactory meterFactory, IOptions<ObservabilityOptions> options)
    : IDiagnosticsProvider
{
    /// <summary>
    /// Gets the version.
    /// </summary>
    private readonly Version? _version = Assembly.GetCallingAssembly().GetName().Version;

    /// <summary>
    /// Gets the activity source.
    /// </summary>
    private ActivitySource? _activitySource;

    /// <summary>
    /// Gets the activity listener.
    /// </summary>
    private ActivityListener? _listener;

    /// <summary>
    /// Gets the meter.
    /// </summary>
    private Meter? _meter;

    /// <inheritdoc />
    public string InstrumentationName { get; } = options.Value.InstrumentationName;

    /// <inheritdoc />
    public ActivitySource ActivitySource
    {
        get
        {
            if (_activitySource != null)
            {
                return _activitySource;
            }

            _activitySource = new ActivitySource(InstrumentationName, _version?.ToString());

            _listener = new ActivityListener
            {
                ShouldListenTo = _ => true,
                Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
            };
            ActivitySource.AddActivityListener(_listener);

            return _activitySource;
        }
    }

    /// <inheritdoc />
    public Meter Meter
    {
        get
        {
            if (_meter != null)
            {
                return _meter;
            }

            _meter = meterFactory.Create(InstrumentationName, _version?.ToString());

            return _meter;
        }
    }

    /// <inheritdoc />
    public async Task ExecuteActivityAsync(
        CreateActivityInfo createActivityInfo,
        Func<Activity?, CancellationToken, Task> action,
        CancellationToken cancellationToken = default
    )
    {
        if (!options.Value.TracingEnabled)
        {
            await action(null, cancellationToken);

            return;
        }

        using var activity =
            ActivitySource
                .CreateActivity(
                    name: $"{InstrumentationName}.{createActivityInfo.Name}",
                    kind: createActivityInfo.ActivityKind,
                    parentContext: createActivityInfo.Parent ?? default,
                    idFormat: ActivityIdFormat.W3C,
                    tags: createActivityInfo.Tags
                )
                ?.Start() ?? Activity.Current;

        try
        {
            await action(activity!, cancellationToken);
            activity?.SetOkStatus();
        }
        catch (Exception ex)
        {
            activity?.SetErrorStatus(ex);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<TResult> ExecuteActivityAsync<TResult>(
        CreateActivityInfo createActivityInfo,
        Func<Activity?, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default
    )
    {
        if (!options.Value.TracingEnabled)
        {
            return await action(null, cancellationToken);
        }

        using var activity =
            ActivitySource
                .CreateActivity(
                    name: $"{InstrumentationName}.{createActivityInfo.Name}",
                    kind: createActivityInfo.ActivityKind,
                    parentContext: createActivityInfo.Parent ?? default,
                    idFormat: ActivityIdFormat.W3C,
                    tags: createActivityInfo.Tags
                )
                ?.Start() ?? Activity.Current;

        try
        {
            var result = await action(activity!, cancellationToken);

            activity?.SetOkStatus();

            return result;
        }
        catch (Exception ex)
        {
            activity?.SetErrorStatus(ex);
            throw;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _listener?.Dispose();
        _meter?.Dispose();
        _activitySource?.Dispose();
        GC.SuppressFinalize(this);
    }
}
