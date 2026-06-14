using Microsoft.AspNetCore.Builder;

namespace BuildingBlocks.Web.Modules.Plugin;

/// <summary>
/// Base class for web application plugins that can configure both the WebApplicationBuilder and WebApplication.
/// </summary>
public abstract class WebApplicationPlugin
{
    /// <summary>
    /// Configures the WebApplicationBuilder before the application is built.
    /// </summary>
    /// <param name="builder">The WebApplicationBuilder instance to configure.</param>
    public virtual void ConfigureWebApplicationBuilder(WebApplicationBuilder builder) { }

    /// <summary>
    /// Configures the WebApplication after it has been built.
    /// </summary>
    /// <param name="app">The WebApplication instance to configure.</param>
    public virtual void ConfigureWebApplication(WebApplication app) { }
}
