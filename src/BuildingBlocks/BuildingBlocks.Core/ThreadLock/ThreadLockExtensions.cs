using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Represents the thread lock extensions.
/// </summary>
public static class ThreadLockExtensions
{
    /// <summary>
    /// Adds the exclusive lock.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddExclusiveLock(this IServiceCollection services)
    {
        services.AddSingleton<IExclusiveLock, ExclusiveLock>();
        services.AddSingleton<IThreadingLock, ThreadingLock>();

        return services;
    }
}
