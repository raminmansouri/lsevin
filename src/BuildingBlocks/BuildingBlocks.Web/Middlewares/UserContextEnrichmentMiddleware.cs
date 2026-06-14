using System.Diagnostics;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Web.Constants;
using BuildingBlocks.Security.Jwt.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Web.Middlewares;

/// <summary>
/// Middleware for handling log user context in HTTP requests.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="UserContextEnrichmentMiddleware"/> class.
/// </remarks>
/// <param name="next">The next delegate/middleware in the pipeline.</param>
public sealed class UserContextEnrichmentMiddleware(RequestDelegate next)
{
    /// <summary>
    /// Invokes the middleware.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <param name="logger">The logger.</param>
    /// <returns>The task object representing the asynchronous operation.</returns>
    public async Task Invoke(HttpContext context, ILogger<UserContextEnrichmentMiddleware> logger)
    {
        var userId = context.User.GetUserIdentity();

        if (userId != IdGenerator.EmptyId)
        {
            Activity.Current?.SetTag(RequestHeaderConstValues.UserId, userId);

            Dictionary<string, object> data = new(StringComparer.Ordinal)
            {
                [nameof(RequestHeaderConstValues.UserId)] = userId,
            };

            using (logger.BeginScope(data))
            {
                await next(context);
            }
        }
        else
        {
            await next(context);
        }
    }
}
