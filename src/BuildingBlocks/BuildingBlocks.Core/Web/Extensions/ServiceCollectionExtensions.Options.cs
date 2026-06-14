using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Extension methods for <see cref="IServiceCollection"/> to register options.
/// </summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds configuration options to the service collection.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddConfigurationOptions<T>(this IServiceCollection services)
        where T : class
    {
        return services.AddConfigurationOptions<T>(typeof(T).Name);
    }

    /// <summary>
    /// Adds configuration options to the service collection with a specified key.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="key">The configuration key.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddConfigurationOptions<T>(this IServiceCollection services, string key)
        where T : class
    {
        services.AddOptions<T>().BindConfiguration(key);

        return services.AddSingleton(x => x.GetRequiredService<IOptions<T>>().Value);
    }

    /// <summary>
    /// Adds validated configuration options to the service collection.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddValidatedOptions<T>(this IServiceCollection services)
        where T : class
    {
        return services.AddValidatedOptions<T>(typeof(T).Name, RequiredConfigurationValidator.Validate);
    }

    /// <summary>
    /// Adds validated configuration options to the service collection with a specified key.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="key">The configuration key.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddValidatedOptions<T>(this IServiceCollection services, string? key)
        where T : class
    {
        return services.AddValidatedOptions<T>(key ?? typeof(T).Name, RequiredConfigurationValidator.Validate);
    }

    /// <summary>
    /// Adds validated configuration options to the service collection with a specified key and validator.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="key">The configuration key.</param>
    /// <param name="validator">The validation function.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddValidatedOptions<T>(
        this IServiceCollection services,
        string key,
        Func<T, bool> validator
    )
        where T : class
    {
        // https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options
        // https://thecodeblogger.com/2021/04/21/options-pattern-in-net-ioptions-ioptionssnapshot-ioptionsmonitor/
        // https://code-maze.com/aspnet-configuration-options/
        // https://code-maze.com/aspnet-configuration-options-validation/
        // https://dotnetdocs.ir/Post/42/difference-between-ioptions-ioptionssnapshot-and-ioptionsmonitor
        // https://andrewlock.net/adding-validation-to-strongly-typed-configuration-objects-in-dotnet-6/
        services.AddOptions<T>().BindConfiguration(key).Validate(validator);

        // IOptions itself registered as singleton
        return services.AddSingleton(x => x.GetRequiredService<IOptions<T>>().Value);
    }
}

/// <summary>
/// Validator class for required configuration properties.
/// </summary>
public static class RequiredConfigurationValidator
{
    /// <summary>
    /// Validates that all properties marked with are not null.
    /// </summary>
    /// <typeparam name="T">The type of the configuration options.</typeparam>
    /// <param name="arg">The configuration instance.</param>
    /// <returns><c>true</c> if validation succeeds; otherwise, throws an exception.</returns>
    /// <exception cref="Exception">Thrown when a required property is null.</exception>
    public static bool Validate<T>(T arg)
        where T : class
    {
        var requiredProperties = typeof(T)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(x => Attribute.IsDefined(x, typeof(RequiredMemberAttribute)));

        foreach (var requiredProperty in requiredProperties)
        {
            var propertyValue = requiredProperty.GetValue(arg);
            if (propertyValue is null)
            {
                throw new InvalidOperationException($"Required property '{requiredProperty.Name}' was null");
            }
        }

        return true;
    }
}
