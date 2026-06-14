using BuildingBlocks.Core.Clock;

namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the extension methods for the <see cref="DateTime"/> class.
/// </summary>
public static class DateTimeExtensions
{
    /// <summary>
    /// Represents the epoch time.
    /// </summary>
    private static readonly DateTime _epoch = new(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// Converts the <see cref="DateTime"/> to Unix time in seconds.
    /// </summary>
    /// <param name="datetime">The date time.</param>
    /// <returns>The Unix time in seconds.</returns>
    public static long ToUnixTimeSecond(this DateTime datetime)
    {
        var unixTime = (datetime.ToUniversalTime() - _epoch).TotalSeconds;
        return (long)unixTime;
    }

    /// <summary>
    /// Converts the Unix time to <see cref="DateTime"/>.
    /// </summary>
    /// <param name="unixTime">The Unix time.</param>
    /// <returns>The <see cref="DateTime"/>.</returns>
    public static DateTime ToDateTime(this long? unixTime) =>
        _epoch.AddSeconds(unixTime ?? ToUnixTimeSecond(SystemClock.Now)).ToLocalTime();

    /// <summary>
    /// Converts the <see cref="DateTime"/> to Unix time in milliseconds.
    /// </summary>
    /// <param name="dateTime">The date time.</param>
    /// <returns>The Unix time in milliseconds.</returns>
    public static long ToUnixTimeMilliseconds(this DateTime dateTime)
    {
        return new DateTimeOffset(dateTime).ToUnixTimeMilliseconds();
    }
}
