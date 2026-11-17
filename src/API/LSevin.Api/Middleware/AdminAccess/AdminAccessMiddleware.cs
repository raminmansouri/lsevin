using System.Security.Claims;
using BuildingBlocks.Security.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Api.Middleware.AdminAccess;

/// <summary>
/// Enforces the admin panel's per-area permissions on the API itself (see <see cref="AdminAccessPolicy"/>).
///
/// It does nothing unless the caller is an <c>admin</c> (not a super admin) calling an endpoint that is
/// gated by the <c>admin</c> policy. For those, a person who is not under access management passes
/// exactly as before; a managed (limited) admin is held to their roles' grants; a revoked one is refused.
///
/// Failure is never permissive: if the access tables cannot be read the answer is 503, not "let them in".
/// Set <c>AdminAccess:Enabled</c> to <c>false</c> to switch it off without a rebuild.
/// </summary>
public sealed class AdminAccessMiddleware(
    RequestDelegate next,
    IAdminAccessStore store,
    IConfiguration configuration,
    ILogger<AdminAccessMiddleware> logger
)
{
    private readonly bool _enabled = configuration.GetValue("AdminAccess:Enabled", true);

    /// <summary>Applies the admin access rules to one request.</summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>A task that completes when the request has been handled.</returns>
    public async Task InvokeAsync(HttpContext context)
    {
        if (!_enabled || !AppliesTo(context, out var userId, out var route))
        {
            await next(context);
            return;
        }

        AdminAccessSnapshot access;
        try
        {
            access = await store.GetAsync(userId, context.RequestAborted);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            return;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin access could not be determined for user {UserId}; refusing the request.", userId);
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.Headers.RetryAfter = "5";
            return;
        }

        if (AdminAccessPolicy.IsAllowed(access, route, context.Request.Method))
        {
            await next(context);
            return;
        }

        // The route pattern is logged on purpose: an admin endpoint this policy does not know yet shows up here.
        logger.LogWarning(
            "Admin access denied: user {UserId} ({Kind}) {Method} {Route}",
            userId,
            access.Kind,
            context.Request.Method,
            route
        );
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(
            new { title = "Forbidden", status = 403, detail = "Your roles do not include this admin area." },
            context.RequestAborted
        );
    }

    private static bool AppliesTo(HttpContext context, out Guid userId, out string route)
    {
        userId = Guid.Empty;
        route = string.Empty;

        var user = context.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        // Super admins are never narrowed, and anyone who is not an admin is not this middleware's business.
        if (user.IsInRole(SecurityConstants.Role.SuperAdmin) || !user.IsInRole(SecurityConstants.Role.Admin))
        {
            return false;
        }

        var endpoint = context.GetEndpoint();
        if (endpoint is null || !RequiresAdminPolicy(endpoint))
        {
            return false;
        }

        var subject = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (!Guid.TryParse(subject, out userId))
        {
            return false;
        }

        route = (endpoint as RouteEndpoint)?.RoutePattern.RawText ?? context.Request.Path.Value ?? string.Empty;
        return true;
    }

    private static bool RequiresAdminPolicy(Endpoint endpoint) =>
        endpoint.Metadata
            .GetOrderedMetadata<IAuthorizeData>()
            .Any(data =>
                string.Equals(data.Policy, SecurityConstants.Role.Admin, StringComparison.OrdinalIgnoreCase)
                || (data.Roles ?? string.Empty)
                    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                    .Contains(SecurityConstants.Role.Admin, StringComparer.OrdinalIgnoreCase)
            );
}
