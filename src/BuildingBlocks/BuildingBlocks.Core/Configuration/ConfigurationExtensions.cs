using System.Reflection;
using Ardalis.GuardClauses;
using Humanizer;
using Microsoft.Extensions.Configuration;

namespace BuildingBlocks.Core.Configuration;

/// <summary>
/// Static helper class for <see cref="IConfiguration"/>.
/// </summary>
public static class ConfigurationExtensions
{
    /// <summary>
    /// Adds the module configuration.
    /// </summary>
    /// <param name="configurationBuilder">The configuration builder.</param>
    /// <param name="module">The module.</param>
    public static void AddModuleConfiguration(this IConfigurationBuilder configurationBuilder, string module)
    {
        // 1) Convert module name to the format you want (lowercase by default)
        var moduleName = module.Humanize(LetterCasing.LowerCase);

        // 2) Get the absolute folder path where this module's DLL is located
        var assemblyPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        // 3) Build the file paths
        var configFilePath = Path.Combine(assemblyPath!, $"modules.{moduleName}.json");
        var configFilePathDev = Path.Combine(assemblyPath!, $"modules.{moduleName}.Development.json");

        // 4) Load those JSON files
        configurationBuilder.AddJsonFile(configFilePath, optional: false, reloadOnChange: true);
        configurationBuilder.AddJsonFile(configFilePathDev, optional: true, reloadOnChange: true);
    }

    /// <summary>
    /// Binds the options.
    /// </summary>
    /// <param name="configuration">The configuration instance to bind.</param>
    /// <param name="options">The options instance to bind.</param>
    /// <param name="section">The configuration section.</param>
    /// <param name="configurator"></param>
    /// <returns>The new instance of <typeparamref name="TOptions"/>.</returns>
    public static TOptions BindOptions<TOptions>(
        this IConfiguration configuration,
        TOptions options,
        string section,
        Action<TOptions>? configurator = null
    )
    {
        var optionsSection = configuration.GetSection(section);
        optionsSection.Bind(options);

        configurator?.Invoke(options);

        return options;
    }

    /// <summary>
    /// Attempts to bind the <typeparamref name="TOptions"/> instance to configuration section values.
    /// </summary>
    /// <typeparam name="TOptions">The given bind model.</typeparam>
    /// <param name="configuration">The configuration instance to bind.</param>
    /// <param name="section">The configuration section.</param>
    /// <param name="configurator"></param>
    /// <returns>The new instance of <typeparamref name="TOptions"/>.</returns>
    public static TOptions BindOptions<TOptions>(
        this IConfiguration configuration,
        string section,
        Action<TOptions>? configurator = null
    )
        where TOptions : new()
    {
        var options = new TOptions();

        var optionsSection = configuration.GetSection(section);
        optionsSection.Bind(options);

        configurator?.Invoke(options);

        return options;
    }

    /// <summary>
    /// Attempts to bind the <typeparamref name="TOptions"/> instance to configuration section values.
    /// </summary>
    /// <typeparam name="TOptions">The given bind model.</typeparam>
    /// <param name="configuration">The configuration instance to bind.</param>
    /// <param name="configurator"></param>
    /// <returns>The new instance of <typeparamref name="TOptions"/>.</returns>
    public static TOptions BindOptions<TOptions>(
        this IConfiguration configuration,
        Action<TOptions>? configurator = null
    )
        where TOptions : new()
    {
        return BindOptions(configuration, typeof(TOptions).Name, configurator);
    }

    /// <summary>
    /// Get settings from configuration.
    /// </summary>
    /// <typeparam name="T">The type of the settings.</typeparam>
    /// <param name="configuration">The configuration.</param>
    /// <param name="sectionName">The section name.</param>
    /// <returns>The settings.</returns>
    public static T GetSettings<T>(this IConfiguration configuration, string sectionName)
        where T : class
    {
        var options = configuration.GetSection(sectionName).Get<T>();

        Guard.Against.Null(options, nameof(T));

        return options;
    }

    /// <summary>
    /// Gets the connection string or throws if not found.
    /// </summary>
    /// <param name="configuration">The configuration.</param>
    /// <param name="name">The name.</param>
    /// <returns>The connection string.</returns>
    public static string GetConnectionStringOrThrow(this IConfiguration configuration, string name)
    {
        return configuration.GetConnectionString(name)
            ?? throw new InvalidOperationException($"The connection string {name} was not found");
    }

    /// <summary>
    /// Gets the value or throws if not found.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="configuration">The configuration.</param>
    /// <param name="name">The name.</param>
    /// <returns>The value.</returns>
    public static T GetValueOrThrow<T>(this IConfiguration configuration, string name)
    {
        return configuration.GetValue<T?>(name)
            ?? throw new InvalidOperationException($"The connection string {name} was not found");
    }
}
