using System.Buffers;
using MessagePack;
using Microsoft.Extensions.Caching.Hybrid;

namespace BuildingBlocks.Caching.Serialization;

/// <summary>
/// Represents a serializer for the custom type.
/// </summary>
/// <typeparam name="T">The type of the object to serialize.</typeparam>
public class MessagePackHybridCacheSerializer<T>(MessagePackSerializerOptions? options = null)
    : IHybridCacheSerializer<T>
{
    private readonly MessagePackSerializerOptions _options = options ?? MessagePackSerializer.DefaultOptions;

    /// <inheritdoc />
    public T Deserialize(ReadOnlySequence<byte> source)
    {
        // Deserialize the byte sequence into the target type T
        return MessagePackSerializer.Deserialize<T>(source.ToArray(), _options);
    }

    /// <inheritdoc />
    public void Serialize(T value, IBufferWriter<byte> target)
    {
        // Serialize the value into the target buffer
        var buffer = MessagePackSerializer.Serialize(value, _options);
        target.Write(buffer);
    }
}
