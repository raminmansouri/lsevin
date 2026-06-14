using System.Diagnostics;
using OpenTelemetry;
using OpenTelemetry.Context.Propagation;

namespace BuildingBlocks.OpenTelemetry;

/// <summary>
/// Represents the telemetry propagator.
/// </summary>
public static class TelemetryPropagator
{
    private static TextMapPropagator _propagator = Propagators.DefaultTextMapPropagator;

    /// <summary>
    /// Uses the default composite text map propagator with trace context and baggage propagators.
    /// </summary>
    public static void UseDefaultCompositeTextMapPropagator()
    {
        _propagator = new CompositeTextMapPropagator([new TraceContextPropagator(), new BaggagePropagator()]);
    }

    /// <summary>
    /// Injects propagation context into a carrier using the specified setter.
    /// </summary>
    /// <typeparam name="T">The type of the carrier.</typeparam>
    /// <param name="context">The propagation context to inject.</param>
    /// <param name="carrier">The carrier to inject into.</param>
    /// <param name="setter">The action to set values on the carrier.</param>
    public static void Inject<T>(this PropagationContext context, T carrier, Action<T, string, string> setter) =>
        _propagator.Inject(context, carrier, setter);

    /// <summary>
    /// Extracts propagation context from a carrier using the specified getter.
    /// </summary>
    /// <typeparam name="T">The type of the carrier.</typeparam>
    /// <param name="carrier">The carrier to extract from.</param>
    /// <param name="getter">The function to get values from the carrier.</param>
    /// <returns>The extracted propagation context.</returns>
    public static PropagationContext Extract<T>(T carrier, Func<T, string, IEnumerable<string>> getter) =>
        _propagator.Extract(default, carrier, getter);

    /// <summary>
    /// Extracts propagation context from a carrier using the specified context and getter.
    /// </summary>
    /// <typeparam name="T">The type of the carrier.</typeparam>
    /// <param name="context">The initial propagation context.</param>
    /// <param name="carrier">The carrier to extract from.</param>
    /// <param name="getter">The function to get values from the carrier.</param>
    /// <returns>The extracted propagation context.</returns>
    public static PropagationContext Extract<T>(
        PropagationContext context,
        T carrier,
        Func<T, string, IEnumerable<string>> getter
    ) => _propagator.Extract(context, carrier, getter);

    /// <summary>
    /// Propagates the activity context and baggage into a carrier.
    /// </summary>
    /// <typeparam name="T">The type of the carrier.</typeparam>
    /// <param name="activity">The activity containing the context to propagate.</param>
    /// <param name="carrier">The carrier to propagate into.</param>
    /// <param name="setter">The action to set values on the carrier.</param>
    /// <returns>The propagation context if successful; otherwise, null.</returns>
    public static PropagationContext? Propagate<T>(this Activity? activity, T carrier, Action<T, string, string> setter)
    {
        if (activity?.Context == null)
        {
            return null;
        }

        var propagationContext = new PropagationContext(activity.Context, Baggage.Current);
        propagationContext.Inject(carrier, setter);

        return propagationContext;
    }

    /// <summary>
    /// Gets the propagation context from the specified or current activity.
    /// </summary>
    /// <param name="activity">The activity to get context from. If null, uses the current activity.</param>
    /// <returns>The propagation context if an activity context exists; otherwise, null.</returns>
    public static PropagationContext? GetPropagationContext(Activity? activity = null)
    {
        var activityContext = (activity ?? Activity.Current)?.Context;
        if (!activityContext.HasValue)
        {
            return null;
        }

        return new PropagationContext(activityContext.Value, Baggage.Current);
    }
}
