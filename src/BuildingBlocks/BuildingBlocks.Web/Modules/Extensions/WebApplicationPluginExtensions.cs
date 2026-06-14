using System.Reflection;
using BuildingBlocks.Web.Modules.Plugin;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules.Extensions;

/// <summary>
/// Extension methods for configuring and mapping web application plugins.
/// <seealso href="https://github.com/davidfowl/WebApplicationPlugins">Based on WebApplicationPlugins by David Fowler</seealso>
/// </summary>
public static class WebApplicationPluginExtensions
{
    /// <summary>
    /// Adds plugins to the web application builder from configuration.
    /// </summary>
    /// <param name="builder">The web application builder.</param>
    /// <param name="pluginSection">The configuration section name for plugins. Defaults to "Plugins".</param>
    public static void AddPlugins(this WebApplicationBuilder builder, string pluginSection = "Plugins")
    {
        var plugins = new List<PluginData>();

        var pluginsSection = builder.Configuration.GetSection(pluginSection);

        var pluginConfig = new Dictionary<string, PluginConfig>(StringComparer.Ordinal);
        pluginsSection.Bind(pluginConfig);

        foreach (var (_, c) in pluginConfig)
        {
            var assemblyFile = Path.GetFullPath(c.AssemblyPath);
            var contentRootPath = c.ContentRootPath is not null ? Path.GetFullPath(c.ContentRootPath) : null;

            if (contentRootPath is not null)
            {
                // Add configuration from content root path
                var pluginAppSettingsFile = Path.Combine(contentRootPath, "appSettings.json");
                var pluginEnvAppSettingsFile = Path.Combine(
                    contentRootPath,
                    $"appSettings.{builder.Environment.EnvironmentName}.json"
                );

                builder.Configuration.AddJsonFile(pluginAppSettingsFile, optional: true, reloadOnChange: true);
                builder.Configuration.AddJsonFile(pluginEnvAppSettingsFile, optional: true, reloadOnChange: true);
            }

            var currentAssembly = Assembly.LoadFrom(assemblyFile);

            foreach (var attr in currentAssembly.GetCustomAttributes<WebApplicationPluginAttribute>())
            {
                var type = attr.PluginType;

                // Detect if those methods were overridden
                var doBuilder =
                    type.GetMethod(nameof(WebApplicationPlugin.ConfigureWebApplicationBuilder))?.DeclaringType
                    != typeof(WebApplicationPlugin);
                var doApp =
                    type.GetMethod(nameof(WebApplicationPlugin.ConfigureWebApplication))?.DeclaringType
                    != typeof(WebApplicationPlugin);

                plugins.Add(new PluginData(doBuilder, doApp, (WebApplicationPlugin)Activator.CreateInstance(type)!));
            }
        }

        foreach (var p in plugins.Where(p => p.ConfigureWebApplicationBuilder))
        {
            p.Plugin.ConfigureWebApplicationBuilder(builder);

            // Use the same instance when mapping plugins
            builder.Services.AddSingleton(p);
        }
    }

    /// <summary>
    /// Maps the configured plugins to the web application.
    /// </summary>
    /// <param name="app">The web application.</param>
    public static void MapPlugins(this WebApplication app)
    {
        foreach (var p in app.Services.GetServices<PluginData>())
        {
            if (p.ConfigureWebApplication)
            {
                p.Plugin.ConfigureWebApplication(app);
            }
        }
    }

    /// <summary>
    /// Represents plugin configuration data including builder and application configuration flags.
    /// </summary>
    /// <param name="ConfigureWebApplicationBuilder">Flag indicating if the plugin configures the web application builder.</param>
    /// <param name="ConfigureWebApplication">Flag indicating if the plugin configures the web application.</param>
    /// <param name="Plugin">The web application plugin instance.</param>
    private sealed record PluginData(
        bool ConfigureWebApplicationBuilder,
        bool ConfigureWebApplication,
        WebApplicationPlugin Plugin
    );

    /// <summary>
    /// Configuration class for plugin settings.
    /// </summary>
    private sealed class PluginConfig
    {
        /// <summary>
        /// Gets or sets the content root path for the plugin.
        /// </summary>
        public string? ContentRootPath { get; set; }

        /// <summary>
        /// Gets or sets the assembly path for the plugin.
        /// </summary>
        public string AssemblyPath { get; set; } = null!;
    }
}
