using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Serialization.ContractResolvers;

/// <summary>
/// Represents a JSON converter that serializes and deserializes all properties of an object.
/// </summary>
internal sealed class TypeDiscriminatorConverter : JsonConverter<object>
{
    private const string TypePropertyName = "$type";

    /// <inheritdoc/>
    public override object? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var jsonDocument = JsonDocument.ParseValue(ref reader);
        var root = jsonDocument.RootElement;

        if (root.TryGetProperty(TypePropertyName, out var typeElement))
        {
            var typeName = typeElement.GetString();
            var type = TypeMapper.GetType(typeName!);
            return JsonSerializer.Deserialize(root.GetRawText(), type, options);
        }

        throw new JsonException("Type information is missing or invalid.");
    }

    /// <inheritdoc/>
    public override void Write(Utf8JsonWriter writer, object value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        foreach (var property in value.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (property.CanRead)
            {
                var propertyValue = property.GetValue(value);
                writer.WritePropertyName(JsonNamingPolicy.CamelCase.ConvertName(property.Name));

                JsonSerializer.Serialize(writer, propertyValue, property.PropertyType, options);
            }
        }

        writer.WriteEndObject();
    }
}
