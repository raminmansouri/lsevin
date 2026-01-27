namespace BuildingBlocks.Core.Persistence.EventSourcing.Projections;

/// <summary>
/// Represents the projection interface.
/// </summary>
public interface IProjection
{
    /// <summary>
    /// When the specified event.
    /// </summary>
    /// <param name="event">The event.</param>
    void When(object @event);
}
