using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Subscriptions;

/// <summary>
/// Represents the event store subscription to all options.
/// </summary>
public sealed class EventStoreSubscriptionToAllOptions
{
    /// <summary>
    /// Gets or sets the subscription identifier.
    /// </summary>
    public string SubscriptionId { get; set; } = "default";

    /// <summary>
    /// Gets or sets the subscription filter options.
    /// </summary>
    public SubscriptionFilterOptions FilterOptions { get; set; } = new(EventTypeFilter.ExcludeSystemEvents());

    /// <summary>
    /// Gets or sets the operation configuration.
    /// </summary>
    public Action<EventStoreClientOperationOptions>? ConfigureOperation { get; set; }

    /// <summary>
    /// Gets or sets the credentials.
    /// </summary>
    public UserCredentials? Credentials { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to resolve link tos.
    /// </summary>
    public bool ResolveLinkTos { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to ignore deserialization errors.
    /// </summary>
    public bool IgnoreDeserializationErrors { get; set; } = true;
}
