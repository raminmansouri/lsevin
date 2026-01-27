using System.Reflection;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Provides extension methods for the Outbox.
/// </summary>
public static class OutboxExtensions
{
    /// <summary>
    /// Adds the outbox message persistence service to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="assemblyMarker">The assembly that marks the project.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddOutboxMessageService(this IServiceCollection services, Assembly assemblyMarker)
    {
        services.AddValidatedOptions<OutboxOptions>();

        services.TryAddScoped<InsertOutboxMessagesInterceptor>();

        services.ConfigureOptions<ConfigureProcessOutboxJob>();

        services.AddScoped<IOutboxStore, SqlOutboxStore>();

        services.AddIdempotentDomainNotificationHandlers(assemblyMarker);

        return services;
    }
}
