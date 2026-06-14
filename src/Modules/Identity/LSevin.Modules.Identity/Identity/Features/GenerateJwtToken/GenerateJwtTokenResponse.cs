namespace LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;

public record GenerateJwtTokenResponse(string Token, DateTime ExpireAt);
