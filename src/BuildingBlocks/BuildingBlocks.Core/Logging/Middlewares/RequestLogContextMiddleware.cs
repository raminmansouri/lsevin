using System.Diagnostics;
using BuildingBlocks.Core.Web.Constants;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace BuildingBlocks.Core.Logging.Middlewares;

/// <summary>
/// Middleware for handling log context in HTTP requests.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="RequestLogContextMiddleware"/> class.
/// </remarks>
/// <param name="next">The next delegate/middleware in the pipeline.</param>
public sealed class RequestLogContextMiddleware(RequestDelegate next)
{
    /// <summary>
    /// Invokes the middleware.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>The task object representing the asynchronous operation.</returns>
    public async Task Invoke(HttpContext context)
    {
        var traceId = Activity.Current?.TraceId.ToString();
        using var logContext = LogContext.PushProperty(RequestHeaderConstValues.TraceId, traceId);
        await next.Invoke(context);
    }
}
