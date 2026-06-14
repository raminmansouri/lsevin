using MessagePack;
using Microsoft.Extensions.Caching.Hybrid;

namespace BuildingBlocks.Caching.Serialization;

/// <summary>
/// Represents a serializer factory for MessagePack.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="MessagePackHybridCacheSerializerFactory"/> class.
/// </remarks>
/// <param name="options">The options for the MessagePack serializer.</param>
public class MessagePackHybridCacheSerializerFactory(MessagePackSerializerOptions? options = null)
    : IHybridCacheSerializerFactory
{
    private readonly MessagePackSerializerOptions _options = options ?? MessagePackSerializer.DefaultOptions;

    /// <inheritdoc />
    public bool TryCreateSerializer<T>(out IHybridCacheSerializer<T> serializer)
    {
        serializer = new MessagePackHybridCacheSerializer<T>(_options);
        return true;
    }
}
