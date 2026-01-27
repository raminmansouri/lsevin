namespace BuildingBlocks.Web.Modules.Plugin;

/// <summary>
/// Attribute used to mark assemblies that contain web application plugins.
/// </summary>
[AttributeUsage(AttributeTargets.Assembly, Inherited = false, AllowMultiple = true)]
public sealed class WebApplicationPluginAttribute : Attribute
{
    /// <summary>
    /// Initializes a new instance of the <see cref="WebApplicationPluginAttribute"/> class.
    /// </summary>
    /// <param name="pluginType">The type of the plugin. Must be a non-abstract class that inherits from <see cref="WebApplicationPlugin"/>.</param>
    /// <exception cref="NotSupportedException">Thrown when the provided type is not a valid plugin type.</exception>
    public WebApplicationPluginAttribute(Type pluginType)
    {
        if (
            !(
                pluginType is { IsClass: true, IsAbstract: false }
                && typeof(WebApplicationPlugin).IsAssignableFrom(pluginType)
            )
        )
        {
            throw new NotSupportedException($"{pluginType} is not a supported {nameof(WebApplicationPlugin)}");
        }

        PluginType = pluginType;
    }

    /// <summary>
    /// Gets the type of the plugin.
    /// </summary>
    public Type PluginType { get; }
}
