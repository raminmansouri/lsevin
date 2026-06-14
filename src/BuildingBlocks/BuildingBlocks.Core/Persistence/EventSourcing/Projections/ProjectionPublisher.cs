using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.Persistence.EventSourcing.Projections;

/// <summary>
/// Represents the projection publisher.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ProjectionPublisher"/> class.
/// </remarks>
/// <param name="serviceProvider">The service provider.</param>
public sealed class ProjectionPublisher(IServiceProvider serviceProvider) : IProjectionPublisher
{
    /// <inheritdoc />
    public async Task PublishAsync<T>(StreamEvent<T> streamEvent, CancellationToken cancellationToken = default)
        where T : IDomainEvent
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var projectionsProcessors = scope.ServiceProvider.GetRequiredService<IEnumerable<IProjectionProcessor>>();
        foreach (var projectionProcessor in projectionsProcessors)
        {
            await projectionProcessor.ProcessEventAsync(streamEvent, cancellationToken);
        }
    }

    /// <inheritdoc />
    public Task PublishAsync(StreamEvent.StreamEvent streamEvent, CancellationToken cancellationToken = default)
    {
        var streamData = streamEvent.Data.GetType();

        var method = typeof(IProjectionPublisher)
            .GetMethods()
            .First(m =>
                string.Equals(m.Name, nameof(PublishAsync), StringComparison.Ordinal)
                && m.GetGenericArguments().Length > 0
            )
            .MakeGenericMethod(streamData);

        return (Task)method.Invoke(this, [streamEvent, cancellationToken])!;
    }
}
