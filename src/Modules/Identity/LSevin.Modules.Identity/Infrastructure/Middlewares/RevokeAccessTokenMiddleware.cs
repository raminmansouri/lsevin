using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Identity.Infrastructure.Middlewares;

public class RevokeAccessTokenMiddleware(ICachingService cachingService) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.User.Identity is null || string.IsNullOrWhiteSpace(context.User.Identity.Name))
        {
            await next(context);
            return;
        }

        var accessToken = GetTokenFromHeader(context);
        var userName = context.User.Identity.Name;

        var revokedToken = await cachingService.GetAsync<string>($"{userName}_{accessToken}_revoked_token");
        if (string.IsNullOrWhiteSpace(revokedToken))
        {
            await next(context);
            return;
        }

        throw new UnAuthorizedException(SharedResource.Access_Denied_Message);
    }

    /// <summary>
    /// Get the token from the authorization header.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>The token.</returns>
    private static string? GetTokenFromHeader(HttpContext context)
    {
        var authorizationHeader = context.Request.Headers.Get<string>("authorization");

        return authorizationHeader;
    }
}

/// <summary>
/// Extension methods for <see cref="IApplicationBuilder"/>.
/// </summary>
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseRevokeAccessTokenMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RevokeAccessTokenMiddleware>();
    }
}
