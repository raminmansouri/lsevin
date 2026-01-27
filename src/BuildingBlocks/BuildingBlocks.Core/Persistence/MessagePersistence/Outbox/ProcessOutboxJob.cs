using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the process outbox job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ProcessOutboxJob"/> class.
/// </remarks>
/// <param name="storedMessageProcessor">The stored message processor.</param>
/// <param name="outboxOptions">The outbox options.</param>
[DisallowConcurrentExecution]
internal sealed class ProcessOutboxJob(
    IStoredMessageProcessor storedMessageProcessor,
    IOptions<OutboxOptions> outboxOptions
) : IJob
{
    /// <inheritdoc />
    public Task Execute(IJobExecutionContext context)
    {
        return storedMessageProcessor.Execute<IDomainNotificationEvent>(
            MessageType.Outbox,
            outboxOptions.Value,
            messageProcessor: async (notification, serviceProvider, token) =>
            {
                var publisher = serviceProvider.GetRequiredService<IEventPublisher>();
                await publisher.PublishAsync(notification, token).ConfigureAwait(false);
            },
            context.CancellationToken
        );
    }
}
