using Microsoft.Extensions.Hosting;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Represents the host environment extensions.
/// </summary>
public static class HostEnvironmentExtensions
{
    /// <summary>
    /// Determines whether the specified environment is a development environment.
    /// </summary>
    /// <param name="env">The environment.</param>
    /// <returns>True if the specified environment is a development environment; otherwise, false.</returns>
    public static bool IsTest(this IHostEnvironment env) => env.IsEnvironment(Environments.Test);

    /// <summary>
    /// Determines whether the specified environment is a development environment.
    /// </summary>
    /// <param name="env">The environment.</param>
    /// <returns>True if the specified environment is a development environment; otherwise, false.</returns>
    public static bool IsDependencyTest(this IHostEnvironment env) => env.IsEnvironment(Environments.DependencyTest);

    /// <summary>
    /// Determines whether the specified environment is a development environment.
    /// </summary>
    /// <param name="env">The environment.</param>
    /// <returns>True if the specified environment is a production environment; otherwise, false.</returns>
    public static bool IsDocker(this IHostEnvironment env) => env.IsEnvironment(Environments.Docker);
}
