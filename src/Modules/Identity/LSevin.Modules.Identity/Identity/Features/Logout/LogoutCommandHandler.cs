using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Web.Extensions;
using BuildingBlocks.Security.Jwt.Options;
using LSevin.Modules.Identity.Identity.Features.RevokeAccessToken;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Identity.Features.Logout;

internal sealed class LogoutCommandHandler(
    ICommandBus commandBus,
    IHttpContextAccessor httpContextAccessor,
    IOptions<JwtOptions> jwtOptions
) : CommandHandler<LogoutCommand, bool>
{
    public override async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext is null)
        {
            return false;
        }

        await httpContext.SignOutAsync();

        if (!jwtOptions.Value.CheckRevokedAccessTokens)
            return false;

        var token = GetTokenFromHeader(httpContext);
        var userName = httpContext.User.Identity!.Name;

        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(userName))
        {
            return false;
        }

        return await commandBus.SendAsync(new RevokeAccessTokenCommand(token, userName), cancellationToken);
    }

    private static string? GetTokenFromHeader(HttpContext context)
    {
        var authorizationHeader = context.Request.Headers.Get<string>("authorization");

        return authorizationHeader;
    }
}
