using System.Reflection;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;

/// <summary>
/// Provides extension methods for the InternalCommand.
/// </summary>
public static class InternalCommandExtensions
{
    /// <summary>
    /// Adds the internal command message persistence service to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="assemblyMarker">The assembly that marks the project.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddInternalCommandMessageService(
        this IServiceCollection services,
        Assembly assemblyMarker
    )
    {
        services.AddValidatedOptions<InternalCommandOptions>();

        services.ConfigureOptions<ConfigureProcessInternalCommandJob>();

        services.AddIdempotentInternalCommandHandlers(assemblyMarker);

        return services;
    }
}
