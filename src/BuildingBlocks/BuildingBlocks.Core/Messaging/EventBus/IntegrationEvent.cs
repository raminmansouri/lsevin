using System.Text.Json.Serialization;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the integration event.
/// </summary>
public abstract record IntegrationEvent : IIntegrationEvent
{
    /// <summary>
    /// Initializes a new instance of the <see cref="IntegrationEvent"/> class.
    /// </summary>
    protected IntegrationEvent()
    {
        Id = IdGenerator.NewId();
        OccurredOn = SystemClock.Now;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="IntegrationEvent"/> class with the specified unique identifier and creation date.
    /// </summary>
    /// <param name="id">The unique identifier of the integration event.</param>
    /// <param name="occurredOn">The date and time at which the integration event was created.</param>
    [JsonConstructor]
    protected IntegrationEvent(Guid id, DateTime occurredOn)
    {
        Id = id;
        OccurredOn = occurredOn;
    }

    /// <inheritdoc />
    [JsonInclude]
    public Guid Id { get; }

    /// <inheritdoc />
    [JsonInclude]
    public DateTime OccurredOn { get; }
}
