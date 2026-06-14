using System.Security.Cryptography;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;
using BuildingBlocks.Core.Persistence.EventSourcing.Projections;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;
using BuildingBlocks.Core.Utils;
using BuildingBlocks.Core.Web.Module;
using BuildingBlocks.Persistence.EventStoreDB.Events;
using EventStore.Client;
using Grpc.Core;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Persistence.EventStoreDB.Subscriptions;

/// <summary>
/// Represents the event store subscription to all.
/// </summary>
/// <param name="eventStoreClient">The event store client.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="projectionPublisher">The projection publisher.</param>
/// <param name="publisher">The publisher.</param>
/// <param name="checkpointRepository">The checkpoint repository.</param>
/// <param name="serializer">The serializer.</param>
/// <param name="logger">The logger.</param>
internal sealed class EventStoreSubscriptionToAll(
    EventStoreClient eventStoreClient,
    IModuleInformation moduleInformation,
    IProjectionPublisher projectionPublisher,
    IEventPublisher publisher,
    ISubscriptionCheckpointRepository checkpointRepository,
    ISerializer serializer,
    ILogger<EventStoreSubscriptionToAll> logger
) : BackgroundService
{
    private EventStoreSubscriptionToAllOptions _subscriptionOptions = null!;
    private string SubscriptionId => _subscriptionOptions.SubscriptionId;
    private readonly object _resubscribeLock = new();
    private CancellationToken _cancellationToken;

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _cancellationToken = stoppingToken;

        return SubscribeToAllAsync(new EventStoreSubscriptionToAllOptions(), stoppingToken);
    }

    /// <summary>
    /// Subscribes to all.
    /// </summary>
    /// <param name="subscriptionOptions">The subscription options.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task SubscribeToAllAsync(EventStoreSubscriptionToAllOptions subscriptionOptions, CancellationToken ct)
    {
        await Task.Yield();

        _subscriptionOptions = subscriptionOptions;

        logger.LogInformation(
            "Subscription to all '{SubscriptionId}' for {Module}",
            subscriptionOptions.SubscriptionId,
            moduleInformation.Name
        );

        var checkpoint = await checkpointRepository.LoadAsync(SubscriptionId, ct).ConfigureAwait(false);

        await eventStoreClient
            .SubscribeToAllAsync(
                checkpoint == null ? FromAll.Start : FromAll.After(new Position(checkpoint.Value, checkpoint.Value)),
                HandleEventAsync,
                subscriptionOptions.ResolveLinkTos,
                HandleDrop,
                subscriptionOptions.FilterOptions,
                subscriptionOptions.Credentials,
                ct
            )
            .ConfigureAwait(false);

        logger.LogInformation("Subscription to all '{SubscriptionId}' started", SubscriptionId);
    }

    /// <summary>
    /// Handles the event.
    /// </summary>
    /// <param name="subscription">The subscription.</param>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task HandleEventAsync(
        StreamSubscription subscription,
        ResolvedEvent resolvedEvent,
        CancellationToken ct
    )
    {
        try
        {
            if (ct.IsCancellationRequested)
            {
                return;
            }

            if (IsEventWithEmptyData(resolvedEvent) || IsCheckpointEvent(resolvedEvent))
            {
                return;
            }

            var streamEvent = resolvedEvent.ToStreamEvent(serializer);

            if (streamEvent == null)
            {
                logger.LogWarning("Couldn't deserialize event with id: {EventId}", resolvedEvent.Event.EventId);

                if (!_subscriptionOptions.IgnoreDeserializationErrors)
                {
                    logger.LogError("Failed to deserialize event with id: {EventId}", resolvedEvent.Event.EventId);
                    return;
                }

                return;
            }

            await publisher.PublishAsync(streamEvent, ct).ConfigureAwait(false);

            await projectionPublisher.PublishAsync(streamEvent, ct).ConfigureAwait(false);

            await checkpointRepository
                .StoreAsync(SubscriptionId, resolvedEvent.Event.Position.CommitPosition, ct)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException e) when (ct.IsCancellationRequested)
        {
            logger.LogError(e, "Subscription to all '{SubscriptionId}' cancelled", SubscriptionId);
        }
        catch (Exception e)
        {
            logger.LogError(
                e,
                "Error consuming message: {ExceptionMessage}{ExceptionStackTrace}",
                e.Message,
                e.StackTrace
            );

            throw;
        }
    }

    /// <summary>
    /// Handles the drop.
    /// </summary>
    /// <param name="subscription">The subscription.</param>
    /// <param name="reason">The reason.</param>
    /// <param name="exception">The exception.</param>
    private void HandleDrop(StreamSubscription? subscription, SubscriptionDroppedReason reason, Exception? exception)
    {
        if (_cancellationToken.IsCancellationRequested)
        {
            logger.LogInformation(
                "Subscription to all '{SubscriptionId}' dropped during shutdown with '{Reason}'",
                SubscriptionId,
                reason
            );

            subscription?.Dispose();
            return;
        }

        logger.LogError(
            exception,
            "Subscription to all '{SubscriptionId}' dropped with '{Reason}'",
            SubscriptionId,
            reason
        );

        if (exception is RpcException { StatusCode: StatusCode.Cancelled })
        {
            subscription?.Dispose();
            return;
        }

        if (!_cancellationToken.IsCancellationRequested)
        {
            Resubscribe();
        }
    }

    /// <summary>
    /// Resubscribes.
    /// </summary>
    private void Resubscribe()
    {
        // Don't attempt to resubscribe if we're shutting down
        if (_cancellationToken.IsCancellationRequested)
        {
            logger.LogInformation("Subscription resubscribe skipped - shutdown in progress");
            return;
        }

        while (!_cancellationToken.IsCancellationRequested)
        {
            var resubscribed = false;

            try
            {
                Monitor.Enter(_resubscribeLock);

                using (NoSynchronizationContextScope.Enter())
                {
                    Task.Run(() => SubscribeToAllAsync(_subscriptionOptions, _cancellationToken), _cancellationToken)
                        .Wait(_cancellationToken);
                }

                resubscribed = true;
            }
            catch (OperationCanceledException)
            {
                // Log and exit if we're shutting down
                logger.LogInformation("Subscription resubscribe cancelled - shutdown in progress");
                return;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Failed to resubscribe to all '{SubscriptionId}'", SubscriptionId);
            }
            finally
            {
                Monitor.Exit(_resubscribeLock);
            }

            if (resubscribed)
            {
                break;
            }

            // Don't sleep if we're shutting down
            if (!_cancellationToken.IsCancellationRequested)
            {
                var randomDelay = 1000 + RandomNumberGenerator.GetInt32(1000);
                Thread.Sleep(randomDelay);
            }
        }
    }

    /// <summary>
    /// Determines whether the specified resolved event has empty data.
    /// </summary>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <returns>True if the event has empty data; otherwise, false.</returns>
    private bool IsEventWithEmptyData(ResolvedEvent resolvedEvent)
    {
        if (resolvedEvent.Event.Data.Length != 0)
        {
            return false;
        }

        logger.LogInformation("Event without data received");
        return true;
    }

    /// <summary>
    /// Determines whether the specified resolved event is a checkpoint event.
    /// </summary>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <returns>True if the event is a checkpoint event; otherwise, false.</returns>
    private bool IsCheckpointEvent(ResolvedEvent resolvedEvent)
    {
        if (resolvedEvent.Event.EventType != TypeMapper.GetTypeName<CheckpointStored>())
        {
            return false;
        }

        logger.LogInformation("Checkpoint event - ignoring");
        return true;
    }
}
