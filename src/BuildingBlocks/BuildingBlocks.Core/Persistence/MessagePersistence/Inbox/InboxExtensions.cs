using System.Reflection;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Provides extension methods for the Inbox.
/// </summary>
public static class InboxExtensions
{
    /// <summary>
    /// Adds the inbox message persistence service to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="assemblyMarker">The assembly for configuring.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddInboxMessageService(this IServiceCollection services, Assembly assemblyMarker)
    {
        services.AddValidatedOptions<InboxOptions>();

        services.ConfigureOptions<ConfigureProcessInboxJob>();

        services.AddIdempotentIntegrationEventHandlers(assemblyMarker);

        return services;
    }
}
