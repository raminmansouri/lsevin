namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed record RefreshTokenResponse(
    Guid UserId,
    string UserName,
    string FirstName,
    string LastName,
    string AccessToken,
    string RefreshToken
);
