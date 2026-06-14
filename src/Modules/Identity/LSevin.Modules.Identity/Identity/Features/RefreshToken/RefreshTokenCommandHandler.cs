using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;
using LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;

namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed class RefreshTokenCommandHandler(
    IJwtService jwtService,
    UserManager<ApplicationUser> userManager,
    ICommandBus commandBus
) : CommandHandler<RefreshTokenCommand, RefreshTokenResponse>
{
    public override async Task<Result<RefreshTokenResponse>> Handle(
        RefreshTokenCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        // invalid token/signing key was passed and we can't extract user claims
        var userClaimsPrincipal = jwtService.GetPrincipalFromToken(command.AccessTokenData);

        if (userClaimsPrincipal is null)
            return AppError.UnAuthorizedError();

        var userId = userClaimsPrincipal.FindFirstValue(JwtRegisteredClaimNames.NameId);

        var identityUser = await userManager.FindByIdAsync(userId ?? string.Empty);

        if (identityUser == null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        var refreshTokenResult = await commandBus.SendAsync(
            new GenerateRefreshTokenCommand(identityUser.Id, command.RefreshTokenData),
            cancellationToken
        );
        if (refreshTokenResult.IsFailure)
            return refreshTokenResult.Errors!.First();

        var accessTokenResult = await commandBus.SendAsync(
            new GenerateJwtTokenCommand(identityUser.ToJwtUserDto(), refreshTokenResult.Value!.Token),
            cancellationToken
        );
        if (accessTokenResult.IsFailure)
            return accessTokenResult.Errors!.First();

        return new RefreshTokenResponse(
            identityUser.Id,
            identityUser.UserName!,
            identityUser.FirstName,
            identityUser.LastName,
            accessTokenResult.Value!.Token,
            refreshTokenResult.Value!.Token
        );
    }
}
