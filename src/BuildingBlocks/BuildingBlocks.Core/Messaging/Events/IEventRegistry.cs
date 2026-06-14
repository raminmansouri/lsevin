namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Interface for registering domain events and their corresponding notifications.
/// </summary>
public interface IEventRegistry
{
    /// <summary>
    /// Registers all domain events and their corresponding notifications.
    /// </summary>
    void RegisterEvents();
}
