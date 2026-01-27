using System.Text.Json;
using System.Text.Json.Serialization;
using OpenTelemetry.Context.Propagation;

namespace BuildingBlocks.OpenTelemetry;

/// <summary>
/// Represents a JSON converter for <see cref="PropagationContext"/>.
/// </summary>
public sealed class PropagationContextJsonConverter : JsonConverter<PropagationContext>
{
    private const string TraceParentPropertyName = "traceparent";
    private const string TraceStatePropertyName = "tracestate";

    /// <inheritdoc />
    public override PropagationContext Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options
    )
    {
        if (reader.TokenType != JsonTokenType.StartObject)
        {
            throw new JsonException("Expected a JSON object.");
        }

        string? traceParent = null;
        string? traceState = null;

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject)
            {
                break;
            }

            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                continue;
            }

            var propertyName = reader.GetString();

            reader.Read(); // Move to the value
            switch (propertyName)
            {
                case TraceParentPropertyName:
                    traceParent = reader.GetString();
                    break;
                case TraceStatePropertyName:
                    traceState = reader.GetString();
                    break;
            }
        }

        var headers = new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            { TraceParentPropertyName, traceParent },
            { TraceStatePropertyName, traceState },
        };

        return TelemetryPropagator.Extract(headers, ExtractTraceContextFromHeaders);
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, PropagationContext value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        value.Inject(
            new Dictionary<string, string>(StringComparer.Ordinal),
            (_, key, val) =>
            {
                writer.WriteString(key, val);
            }
        );

        writer.WriteEndObject();
    }

    /// <summary>
    /// Extracts trace context from headers.
    /// </summary>
    /// <param name="headers">The headers.</param>
    /// <param name="key">The key.</param>
    /// <returns>The trace context.</returns>
    private static IReadOnlyList<string> ExtractTraceContextFromHeaders(Dictionary<string, string?> headers, string key)
    {
        return headers.TryGetValue(key, out var value) && value != null ? [value] : Array.Empty<string>();
    }
}
