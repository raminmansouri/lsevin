using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Caching.Hybrid;

namespace BuildingBlocks.Caching.Serialization;

/// <summary>
/// Represents a serializer factory hybrid cache.
/// </summary>
internal sealed class SystemTextJsonCacheSerializerFactory : IHybridCacheSerializerFactory
{
    /// <inheritdoc />
    public bool TryCreateSerializer<T>([NotNullWhen(true)] out IHybridCacheSerializer<T>? serializer)
    {
        serializer = new SystemTextJsonSerializer<T>();
        return true;
    }
}
