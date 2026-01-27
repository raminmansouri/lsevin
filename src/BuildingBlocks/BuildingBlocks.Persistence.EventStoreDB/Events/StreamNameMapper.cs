using System.Collections.Concurrent;

namespace BuildingBlocks.Persistence.EventStoreDB.Events;

/// <summary>
/// Represents the stream name mapper.
/// </summary>
public class StreamNameMapper
{
    /// <summary>
    /// The instance.
    /// </summary>
    private static readonly StreamNameMapper _instance = new();

    /// <summary>
    /// The type name map.
    /// </summary>
    private readonly ConcurrentDictionary<Type, string> _typeNameMap = new();

    /// <summary>
    /// Adds the custom map.
    /// </summary>
    /// <typeparam name="TStream">The type of the stream.</typeparam>
    /// <param name="mappedStreamName">The mapped stream name.</param>
    public static void AddCustomMap<TStream>(string mappedStreamName) =>
        AddCustomMap(typeof(TStream), mappedStreamName);

    /// <summary>
    /// Adds the custom map.
    /// </summary>
    /// <param name="streamType">The stream type.</param>
    /// <param name="mappedStreamName">The mapped stream name.</param>
    public static void AddCustomMap(Type streamType, string mappedStreamName)
    {
        _instance._typeNameMap.AddOrUpdate(streamType, mappedStreamName, (_, _) => mappedStreamName);
    }

    /// <summary>
    /// Converts the specified stream type to stream id.
    /// </summary>
    /// <typeparam name="TStream">The type of the stream.</typeparam>
    /// <param name="aggregateId">The aggregate identifier.</param>
    /// <param name="tenantId">The tenant identifier.</param>
    /// <returns>The stream id.</returns>
    public static string ToStreamId<TStream>(object aggregateId, object? tenantId = null) =>
        ToStreamId(typeof(TStream), aggregateId, tenantId);

    /// <summary>
    /// Converts the specified stream type to stream id.
    /// </summary>
    /// <param name="streamType">Type of the stream.</param>
    /// <param name="aggregateId">The aggregate identifier.</param>
    /// <param name="tenantId">The tenant identifier.</param>
    /// <returns>The stream id.</returns>
    public static string ToStreamId(Type streamType, object aggregateId, object? tenantId = null)
    {
        var tenantPrefix = tenantId != null ? $"{tenantId}_" : "";

        return $"{tenantPrefix}{streamType.Name}-{aggregateId}";
    }
}
