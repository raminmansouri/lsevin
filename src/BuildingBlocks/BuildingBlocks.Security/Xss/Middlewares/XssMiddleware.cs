using BuildingBlocks.Security.Common;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Security.Xss.Middlewares;

/// <summary>
/// Middleware for handling Cross-Site Scripting (XSS) protection headers.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="XssMiddleware"/> class.
/// </remarks>
/// <param name="next">The next delegate/middleware in the pipeline.</param>
public sealed class XssMiddleware(RequestDelegate next)
{
    /// <summary>
    /// Invokes the middleware.
    /// </summary>
    /// <param name="httpContext">The HTTP context.</param>
    /// <returns>The task object representing the asynchronous operation.</returns>
    public Task Invoke(HttpContext httpContext)
    {
        httpContext.Response.Headers.Append(
            SecurityConstants.ContentSecurityPolicy,
            SecurityConstants.ContentSecurityPolicyValue
        );
        httpContext.Response.Headers.Append(SecurityConstants.XXssProtection, SecurityConstants.XXssProtectionValue);
        return next(httpContext);
    }
}
