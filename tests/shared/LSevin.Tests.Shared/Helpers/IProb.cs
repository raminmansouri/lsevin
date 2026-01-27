namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Represents a probe.
/// </summary>
public interface IProbe
{
    /// <summary>
    /// Determines whether the probe is satisfied.
    /// </summary>
    /// <returns>True if the probe is satisfied; otherwise, false.</returns>
    bool IsSatisfied();

    /// <summary>
    /// Gets the sample.
    /// </summary>
    /// <returns>The sample.</returns>
    Task SampleAsync();

    /// <summary>
    /// Describes the failure to.
    /// </summary>
    /// <returns>The failure description.</returns>
    string DescribeFailureTo();
}

/// <summary>
/// Represents a probe.
/// </summary>
/// <typeparam name="T">The type of the sample.</typeparam>
public interface IProbe<T>
{
    /// <summary>
    /// Determines whether the probe is satisfied.
    /// </summary>
    /// <param name="sample">The sample.</param>
    /// <returns>True if the probe is satisfied; otherwise, false.</returns>
    bool IsSatisfied(T? sample);

    /// <summary>
    /// Gets the sample.
    /// </summary>
    /// <returns>The sample.</returns>
    Task<T> GetSampleAsync();

    /// <summary>
    /// Describes the failure to.
    /// </summary>
    /// <returns>The failure description.</returns>
    string DescribeFailureTo();
}
