using System.Reflection;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;
using BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;
using BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Provides extension methods for the StoredMessage.
/// </summary>
public static class StoredMessageExtensions
{
    /// <summary>
    /// Adds the stored message service to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="assemblyMarker">The assembly for configuring.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddStoredMessageService(this IServiceCollection services, Assembly assemblyMarker)
    {
        services
            .AddScoped<IStoredMessageProcessor, StoredMessageProcessor>()
            .AddScoped<IIdempotencyService, IdempotencyService>()
            .AddOutboxMessageService(assemblyMarker)
            .AddInboxMessageService(assemblyMarker)
            .AddInternalCommandMessageService(assemblyMarker);

        return services;
    }

    /// <summary>
    /// Gets the table name for the specified message type.
    /// </summary>
    /// <param name="messageType">The message type.</param>
    /// <returns>The table name.</returns>
    public static string GetStoredTableName(this MessageType messageType)
    {
        return messageType switch
        {
            MessageType.Inbox => "inbox_messages",
            MessageType.InternalCommand => "internal_command_messages",
            MessageType.Outbox => "outbox_messages",
            _ => throw new ArgumentOutOfRangeException(nameof(messageType), messageType, null),
        };
    }

    /// <summary>
    /// Gets the table name for the specified message type.
    /// </summary>
    /// <param name="messageType">The message type.</param>
    /// <returns>The table name.</returns>
    public static string GetConsumerTableName(this MessageType messageType)
    {
        return messageType switch
        {
            MessageType.Inbox => "inbox_message_consumers",
            MessageType.InternalCommand => "internal_command_message_consumers",
            MessageType.Outbox => "outbox_message_consumers",
            _ => throw new ArgumentOutOfRangeException(nameof(messageType), messageType, null),
        };
    }
}
