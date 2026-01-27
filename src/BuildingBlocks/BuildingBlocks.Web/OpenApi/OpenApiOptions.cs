namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Represents the OpenAPI options.
/// </summary>
public sealed class OpenApiOptions
{
    /// <summary>
    /// Gets or sets the title.
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Gets or sets the description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the contact username.
    /// </summary>
    public string? ContactUserName { get; set; }

    /// <summary>
    /// Gets or sets the contact email.
    /// </summary>
    public string? ContactEmail { get; set; }
}
