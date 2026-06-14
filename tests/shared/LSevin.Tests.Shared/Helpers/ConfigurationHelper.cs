using BuildingBlocks.Core.Configuration;
using Microsoft.Extensions.Configuration;

namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Represents a configuration helper.
/// </summary>
public static class ConfigurationHelper
{
    /// <summary>
    /// Gets the configuration root.
    /// </summary>
    private static readonly IConfigurationRoot _configurationRoot;

    /// <summary>
    /// Initializes static members of the <see cref="ConfigurationHelper"/> class.
    /// </summary>
    static ConfigurationHelper()
    {
        _configurationRoot = BuildConfiguration();
    }

    /// <summary>
    /// Binds the options.
    /// </summary>
    public static TOptions BindOptions<TOptions>()
        where TOptions : new()
    {
        return _configurationRoot.BindOptions<TOptions>();
    }

    /// <summary>
    /// Builds the configuration.
    /// </summary>
    /// <returns>The configuration root.</returns>
    private static IConfigurationRoot BuildConfiguration()
    {
        const string appSettingsFileName = "appsettings.json";
        const string appSettingsTestFileName = "appsettings.test.json";

        var rootPath = Directory.GetCurrentDirectory();

        return new ConfigurationBuilder()
            .SetBasePath(rootPath)
            .AddJsonFile(appSettingsFileName)
            .AddJsonFile(appSettingsTestFileName, optional: true)
            .AddEnvironmentVariables()
            .Build();
    }
}
