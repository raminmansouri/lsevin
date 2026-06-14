using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Quartz;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;

/// <summary>
/// Represents the process internal command job.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ProcessInternalCommandJob"/> class.
/// </remarks>
/// <param name="storedMessageProcessor">The stored message processor.</param>
/// <param name="internalCommandOptions">The internal command options.</param>
[DisallowConcurrentExecution]
internal sealed class ProcessInternalCommandJob(
    IStoredMessageProcessor storedMessageProcessor,
    IOptions<InternalCommandOptions> internalCommandOptions
) : IJob
{
    /// <inheritdoc />
    public Task Execute(IJobExecutionContext context)
    {
        return storedMessageProcessor.Execute<IInternalCommand>(
            MessageType.InternalCommand,
            internalCommandOptions.Value,
            messageProcessor: async (command, serviceProvider, token) =>
            {
                var commandBus = serviceProvider.GetRequiredService<ICommandBus>();
                _ = await commandBus.SendAsync(command, token).ConfigureAwait(false);
            },
            context.CancellationToken
        );
    }
}
