namespace BuildingBlocks.Core.Scheduling;

/// <summary>
/// Represents the constants for the scheduler.
/// </summary>
public static class MySchedulerConstants
{
    /// <summary>
    /// Generates a cron expression for scheduling tasks every X seconds.
    /// </summary>
    /// <param name="seconds">The number of seconds interval.</param>
    /// <returns>A cron expression string.</returns>
    public static string EveryXSeconds(int seconds)
    {
        return $"0/{seconds} * * ? * *";
    }

    /// <summary>
    /// Generates a cron expression for scheduling tasks every X minutes.
    /// </summary>
    /// <param name="minutes">The number of minutes interval.</param>
    /// <returns>A cron expression string.</returns>
    public static string EveryXMinutes(int minutes)
    {
        return $"0 0/{minutes} * ? * *";
    }

    /// <summary>
    /// Generates a cron expression for scheduling tasks every X hours.
    /// </summary>
    /// <param name="hours">The number of hours interval.</param>
    /// <returns>A cron expression string.</returns>
    public static string EveryXHours(int hours)
    {
        return $"0 0 0/{hours} ? * *";
    }

    /// <summary>
    /// The cron expression for every minute.
    /// </summary>
    public const string EveryDayAtTwelveAM = "0 0 0 * * ?";
}
