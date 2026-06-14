using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Logging.Utilities;

/// <summary>
/// Provides a delegating handler that logs the outgoing HTTP requests and the received responses.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="LoggingDelegatingHandler"/> class.
/// </remarks>
/// <param name="logger">The logger instance used to log information.</param>
public sealed class LoggingDelegatingHandler(ILogger<LoggingDelegatingHandler> logger) : DelegatingHandler
{
    /// <inheritdoc />
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            logger.LogInformation("Sending request to {Url}", request.RequestUri);

            var response = await base.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                logger.LogInformation("Received a success response from {Url}", response.RequestMessage?.RequestUri);
            }
            else
            {
                logger.LogWarning(
                    "Received a non-success status code {StatusCode} from {Url}",
                    (int)response.StatusCode,
                    response.RequestMessage?.RequestUri
                );
            }

            return response;
        }
        catch (HttpRequestException ex)
            when (ex.InnerException is SocketException { SocketErrorCode: SocketError.ConnectionRefused })
        {
            var hostWithPort =
                request.RequestUri != null && request.RequestUri.IsDefaultPort
                    ? request.RequestUri.DnsSafeHost
                    : $"{request.RequestUri?.DnsSafeHost}:{request.RequestUri?.Port}";

            logger.LogCritical(
                ex,
                "Unable to connect to {Host}. Please check the "
                    + "configuration to ensure the correct URL for the service "
                    + "has been configured.",
                hostWithPort
            );
        }

        return new HttpResponseMessage(HttpStatusCode.BadGateway) { RequestMessage = request };
    }
}
