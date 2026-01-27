using System.Text.Json;
using System.Text.Json.Serialization;
using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Serialization;

/// <summary>
/// Represents the default serializer.
/// </summary>
internal sealed class DefaultSerializer : ISerializer
{
    /// <inheritdoc />
    public string Serialize(object? obj, bool camelCase = true, bool indented = true)
    {
        return JsonSerializer.Serialize(obj, CreateSerializerSettings(camelCase, indented));
    }

    /// <inheritdoc />
    public T? Deserialize<T>(string payload, bool camelCase = true)
    {
        return JsonSerializer.Deserialize<T>(payload, CreateSerializerSettings(camelCase));
    }

    /// <inheritdoc />
    public object? Deserialize(string payload, Type type, bool camelCase = true)
    {
        return JsonSerializer.Deserialize(payload, type, CreateSerializerSettings(camelCase));
    }

    /// <inheritdoc />
    public object? Deserialize(string payload, string payloadType)
    {
        var type = TypeMapper.GetType(payloadType);
        return JsonSerializer.Deserialize(payload, type, CreateSerializerSettings());
    }

    /// <summary>
    /// Creates the JSON serializer settings.
    /// </summary>
    /// <param name="camelCase">The flag indicating whether to use camel case for property names.</param>
    /// <param name="indented">The flag indicating whether to use indented formatting.</param>
    /// <returns>The JSON serializer settings.</returns>
    private static JsonSerializerOptions CreateSerializerSettings(bool camelCase = true, bool indented = false)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = camelCase ? JsonNamingPolicy.CamelCase : null,
            WriteIndented = indented,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNameCaseInsensitive = true,
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
        };

        return options;
    }
}
