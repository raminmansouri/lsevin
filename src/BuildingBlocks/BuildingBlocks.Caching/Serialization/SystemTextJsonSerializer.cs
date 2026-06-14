using System.Buffers;
using System.Text.Json;
using BuildingBlocks.Core.Serialization;
using Microsoft.Extensions.Caching.Hybrid;

namespace BuildingBlocks.Caching.Serialization;

/// <summary>
/// Represents a serializer for the custom type.
/// </summary>
/// <typeparam name="T">The type of the object to serialize.</typeparam>
internal sealed class SystemTextJsonSerializer<T> : IHybridCacheSerializer<T>
{
    /// <inheritdoc />
    public T Deserialize(ReadOnlySequence<byte> source)
    {
        var reader = new Utf8JsonReader(source);
        return JsonSerializer.Deserialize<T>(ref reader, JsonSerializationSettings.WithIndentedFormatting) ?? default!;
    }

    /// <inheritdoc />
    public void Serialize(T value, IBufferWriter<byte> target)
    {
        using var writer = new Utf8JsonWriter(target);
        JsonSerializer.Serialize(writer, value, JsonSerializationSettings.WithIndentedFormatting);
    }
}
