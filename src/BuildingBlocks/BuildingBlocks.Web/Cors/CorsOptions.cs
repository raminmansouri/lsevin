namespace BuildingBlocks.Web.Cors;

/// <summary>
/// Represents the options for configuring CORS in an ASP.NET Core application.
/// </summary>
public sealed class CorsOptions
{
    /// <summary>
    /// Gets or sets the list of allowed URLs for CORS.
    /// </summary>
    public required IEnumerable<string> AllowedUrls { get; set; }
}
