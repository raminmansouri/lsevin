using System.Security.Claims;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Models;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;

namespace LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;

internal sealed class GenerateJwtTokenCommandHandler(UserManager<ApplicationUser> userManager, IJwtService jwtService)
    : CommandHandler<GenerateJwtTokenCommand, GenerateJwtTokenResponse>
{
    public override async Task<Result<GenerateJwtTokenResponse>> Handle(
        GenerateJwtTokenCommand request,
        CancellationToken cancellationToken
    )
    {
        var user = request.User;

        if (string.IsNullOrEmpty(user.UserName) || string.IsNullOrEmpty(user.Email))
            return AppError.NotFoundErrorMessage(SharedResource.User);

        var allClaimsResult = await GetClaimsAsync(user.UserName);
        if (allClaimsResult.IsFailure)
            return allClaimsResult.Errors!.First();
        var fullName = $"{user.FirstName} {user.LastName}";

        var generateTokenResult = jwtService.GenerateJwtToken(
            user.UserName,
            user.Email,
            user.Id.ToString(),
            isVerified: user.EmailConfirmed || user.PhoneNumberConfirmed,
            fullName,
            request.RefreshToken,
            usersClaims: [.. allClaimsResult.Value.UserClaims],
            rolesClaims: [.. allClaimsResult.Value.Roles],
            permissionsClaims: [.. allClaimsResult.Value.PermissionClaims]
        );
        return new GenerateJwtTokenResponse(generateTokenResult.AccessToken, generateTokenResult.ExpireAt);
    }

    private async Task<
        Result<(List<Claim> UserClaims, IList<string> Roles, List<string> PermissionClaims)>
    > GetClaimsAsync(string userName)
    {
        var appUser = await userManager.FindByNameAsync(userName);
        if (appUser is null)
            return AppError.NotFoundErrorMessage(userName);

        var userClaims = (await userManager.GetClaimsAsync(appUser))
            .Where(x => !string.Equals(x.Type, CustomClaimTypes.Permission, StringComparison.Ordinal))
            .ToList();

        var roles = await userManager.GetRolesAsync(appUser);

        var permissions = (await userManager.GetClaimsAsync(appUser))
            .Where(x => string.Equals(x.Type, CustomClaimTypes.Permission, StringComparison.Ordinal))
            .Select(x => x.Value)
            .ToList();

        return (UserClaims: userClaims, Roles: roles, PermissionClaims: permissions);
    }
}
