namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Represents a timeout.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="Timeout"/> class.
/// </remarks>
/// <param name="duration">The duration.</param>
public class Timeout(int duration)
{
    /// <summary>
    /// The end time.
    /// </summary>
    private readonly DateTime _endTime = DateTime.Now.AddMilliseconds(duration);

    /// <summary>
    /// Determines whether the specified timeout has timed out.
    /// </summary>
    /// <returns>True if the specified timeout has timed out; otherwise, false.</returns>
    public bool HasTimedOut()
    {
        return DateTime.Now > _endTime;
    }
}
