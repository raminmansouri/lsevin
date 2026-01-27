using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using BuildingBlocks.Core.Web.Module;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Represents the process inbox job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ProcessInboxJob"/> class.
/// </remarks>
/// <param name="storedMessageProcessor">The stored message processor.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="inboxOptions">The inbox options.</param>
[DisallowConcurrentExecution]
internal sealed class ProcessInboxJob(
    IStoredMessageProcessor storedMessageProcessor,
    IModuleInformation moduleInformation,
    IOptions<InboxOptions> inboxOptions
) : IJob
{
    /// <inheritdoc />
    public Task Execute(IJobExecutionContext context)
    {
        return storedMessageProcessor.Execute<IIntegrationEvent>(
            MessageType.Inbox,
            inboxOptions.Value,
            messageProcessor: async (integrationEvent, serviceProvider, token) =>
            {
                var handlers = IntegrationEventHandlersFactory.GetHandlers(
                    integrationEvent.GetType(),
                    serviceProvider,
                    moduleInformation.Assembly
                );

                foreach (var handler in handlers)
                {
                    await handler.Handle(integrationEvent, token).ConfigureAwait(false);
                }
            },
            context.CancellationToken
        );
    }
}
