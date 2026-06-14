using System.Diagnostics;
using BuildingBlocks.Core.Serialization;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Logging.Middlewares;

/// <summary>
/// Logging behavior for handling requests in the Mediator pipeline.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="LoggingBehavior{TRequest, TResponse}"/> class.
/// </remarks>
/// <param name="logger">The logger.</param>
/// <param name="serializer">The serializer.</param>
public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger,
    ISerializer serializer
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
        var typeName = typeof(TRequest).Name;

        Activity.Current?.AddTag("request.type", typeName);
        logger.LogInformation("[MediatR] - Starting to handle {TypeName}. Payload: {@Request}", typeName, request);

        var startTime = Stopwatch.GetTimestamp();
        var response = await next(cancellationToken);
        var delta = Stopwatch.GetElapsedTime(startTime - Stopwatch.GetTimestamp()).TotalMilliseconds;

        logger.LogInformation(
            "[MediatR] - Finished handling request Request {TypeName} in {Time} ms. Response: {Response}",
            typeName,
            delta,
            serializer.Serialize(response, camelCase: false)
        );

        return response;
    }
}
