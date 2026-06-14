namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the options for the HTTP client.
/// </summary>
public abstract class HttpClientOptions
{
    /// <summary>
    /// Gets or sets the base address.
    /// </summary>
    public virtual string BaseAddress { get; set; } = null!;

    /// <summary>
    /// Gets or sets the API key.
    /// </summary>
    public virtual string ApiKey { get; set; } = null!;
}
