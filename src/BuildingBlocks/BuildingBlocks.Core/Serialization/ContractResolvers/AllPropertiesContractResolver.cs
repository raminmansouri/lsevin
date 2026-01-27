using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BuildingBlocks.Core.Serialization.ContractResolvers;

/// <summary>
/// Represents a JSON converter that serializes and deserializes all properties of an object.
/// </summary>
/// <typeparam name="T">The type of the object.</typeparam>
internal sealed class AllPropertiesJsonConverter<T> : JsonConverter<T>
{
    /// <inheritdoc/>
    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartObject)
        {
            throw new JsonException("Expected StartObject token");
        }

        var instance = Activator.CreateInstance<T>();
        var properties = typeToConvert.GetProperties(
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance
        );

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndObject)
            {
                return instance;
            }

            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException("Expected PropertyName token");
            }

            var propertyName = reader.GetString();
            reader.Read();

            var property = properties.FirstOrDefault(p =>
                string.Equals(p.Name, propertyName, StringComparison.OrdinalIgnoreCase)
            );
            if (property != null && property.CanWrite)
            {
                var value = JsonSerializer.Deserialize(ref reader, property.PropertyType, options);
                property.SetValue(instance, value);
            }
            else
            {
                reader.Skip();
            }
        }

        throw new JsonException("Expected EndObject token");
    }

    /// <inheritdoc/>
    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        var properties = value
            ?.GetType()
            .GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        if (properties != null)
        {
            foreach (var property in properties)
            {
                if (property.CanRead)
                {
                    var propertyValue = property.GetValue(value);
                    var propertyName = options.PropertyNamingPolicy?.ConvertName(property.Name) ?? property.Name;
                    writer.WritePropertyName(propertyName);
                    JsonSerializer.Serialize(writer, propertyValue, property.PropertyType, options);
                }
            }
        }

        writer.WriteEndObject();
    }
}
