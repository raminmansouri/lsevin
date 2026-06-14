namespace BuildingBlocks.Core.Clock;

/// <summary>
/// Represent system clock.
/// </summary>
public static class SystemClock
{
    /// <summary>
    /// Represents a system clock that provides the current date and time.
    /// </summary>
    private static DateTime? _customDate;

    /// <summary>
    /// Gets the current date and time. If a custom date is set, returns the custom date; otherwise, returns the current UTC date and time.
    /// </summary>
    /// <value>The current date and time.</value>
    public static DateTime Now
    {
        get
        {
            if (_customDate.HasValue)
            {
                return _customDate.Value;
            }

            return DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Gets the current date. If a custom date is set, returns the custom date; otherwise, returns the current UTC date.
    /// </summary>
    public static DateTime Today => Now.Date;

    /// <summary>
    /// Sets a custom date and time to be returned by the Now property.
    /// </summary>
    /// <param name="customDate">The custom date and time.</param>
    public static void Set(DateTime customDate) => _customDate = customDate;

    /// <summary>
    /// Resets the custom date and time, causing the Now property to return the current UTC date and time.
    /// </summary>
    public static void Reset() => _customDate = null;
}
