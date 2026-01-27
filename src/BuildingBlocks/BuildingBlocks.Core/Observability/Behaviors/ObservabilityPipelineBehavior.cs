using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Observability.CoreDiagnostics.Commands;
using BuildingBlocks.Core.Observability.CoreDiagnostics.Query;
using MediatR;

namespace BuildingBlocks.Core.Observability.Behaviors;

/// <summary>
/// Represents the observability pipeline behavior.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="ObservabilityPipelineBehavior{TRequest,TResponse}"/> class.
/// </remarks>
/// <param name="commandActivity">The command activity.</param>
/// <param name="commandMetrics">The command metrics.</param>
/// <param name="queryActivity">The query activity.</param>
/// <param name="queryMetrics">The query metrics.</param>
public class ObservabilityPipelineBehavior<TRequest, TResponse>(
    CommandHandlerActivity commandActivity,
    CommandHandlerMetrics commandMetrics,
    QueryHandlerActivity queryActivity,
    QueryHandlerMetrics queryMetrics
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : notnull
{
    /// <inheritdoc />
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var isCommand = request is IBaseCommand;
        var isQuery = request is IBaseQuery;

        if (isCommand)
        {
            commandMetrics.StartExecuting<TRequest>();
        }

        if (isQuery)
        {
            queryMetrics.StartExecuting<TRequest>();
        }

        try
        {
            if (isCommand)
            {
                var commandResult = await commandActivity.Execute<TRequest, TResponse>(
                    (_, _) => next(cancellationToken),
                    cancellationToken
                );

                commandMetrics.FinishExecuting<TRequest>();

                return commandResult;
            }

            if (isQuery)
            {
                var queryResult = await queryActivity.Execute<TRequest, TResponse>(
                    (_, _) => next(cancellationToken),
                    cancellationToken
                );

                queryMetrics.FinishExecuting<TRequest>();

                return queryResult;
            }
        }
        catch (Exception)
        {
            if (isQuery)
            {
                queryMetrics.FailedCommand<TRequest>();
            }

            if (isCommand)
            {
                commandMetrics.FailedCommand<TRequest>();
            }

            throw;
        }

        return await next(cancellationToken);
    }
}
