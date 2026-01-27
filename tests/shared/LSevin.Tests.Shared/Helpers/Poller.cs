namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Represents a poller.
/// </summary>
public sealed class Poller(int timeoutMillis)
{
    /// <summary>
    /// The poll delay.
    /// </summary>
    private readonly int _pollDelayMillis = 1000;

    /// <summary>
    /// Determines whether the specified timeout has timed out.
    /// </summary>
    /// <returns>True if the specified timeout has timed out; otherwise, false.</returns>
    public async Task CheckAsync(IProbe probe)
    {
        var timeout = new Timeout(timeoutMillis);
        while (!probe.IsSatisfied())
        {
            if (timeout.HasTimedOut())
            {
                throw new AssertErrorException(DescribeFailureOf(probe));
            }

            await Task.Delay(_pollDelayMillis);
            await probe.SampleAsync();
        }
    }

    public async Task<T?> GetAsync<T>(IProbe<T> probe)
        where T : class
    {
        var timeout = new Timeout(timeoutMillis);
        T? sample = null;
        while (!probe.IsSatisfied(sample))
        {
            if (timeout.HasTimedOut())
            {
                throw new AssertErrorException(DescribeFailureOf(probe));
            }

            await Task.Delay(_pollDelayMillis);
            sample = await probe.GetSampleAsync();
        }

        return sample;
    }

    private static string DescribeFailureOf(IProbe probe)
    {
        return probe.DescribeFailureTo();
    }

    private static string DescribeFailureOf<T>(IProbe<T> probe)
    {
        return probe.DescribeFailureTo();
    }
}
