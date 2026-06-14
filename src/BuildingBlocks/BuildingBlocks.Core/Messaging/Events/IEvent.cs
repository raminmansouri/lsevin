using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the integration event.
/// </summary>
public interface IEvent : INotification
{
    /// <summary>
    /// Gets the unique identifier of the integration event.
    /// </summary>
    Guid Id => IdGenerator.NewId();

    /// <summary>
    /// Gets the date and time at which the integration event was created.
    /// </summary>
    DateTime OccurredOn => SystemClock.Now;
}
