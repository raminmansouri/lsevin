namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed record RefreshTokenRequest(string AccessToken, string RefreshToken);
