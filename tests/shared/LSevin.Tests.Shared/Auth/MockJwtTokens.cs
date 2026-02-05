using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;
using Microsoft.IdentityModel.Tokens;

namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// Mock JWT tokens for integration tests.
/// </summary>
public static class MockJwtTokens
{
    /// <summary>
    /// Gets the issuer of the JWT tokens.
    /// </summary>
    public static string Issuer { get; } = IdGenerator.NewId().ToString();

    /// <summary>
    /// Gets the security key for the JWT tokens.
    /// </summary>
    public static SecurityKey SecurityKey { get; }

    /// <summary>
    /// Gets the signing credentials for the JWT tokens.
    /// </summary>
    public static SigningCredentials SigningCredentials { get; }

    /// <summary>
    /// The JWT token handler.
    /// </summary>
    private static readonly JwtSecurityTokenHandler _tokenHandler = new();

    /// <summary>
    /// The random number generator.
    /// </summary>
    private static readonly RandomNumberGenerator _rng = RandomNumberGenerator.Create();

    /// <summary>
    /// The key for the JWT tokens.
    /// </summary>
    private static readonly byte[] _key = new byte[32];

    static MockJwtTokens()
    {
        _rng.GetBytes(_key);
        SecurityKey = new SymmetricSecurityKey(_key) { KeyId = IdGenerator.NewId().ToString() };
        SigningCredentials = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);
    }

    /// <summary>
    /// Generates a JWT token.
    /// </summary>
    /// <param name="claims">The claims to include in the token.</param>
    /// <returns>The JWT token.</returns>
    public static string GenerateJwtToken(IEnumerable<Claim> claims)
    {
        return _tokenHandler.WriteToken(
            new JwtSecurityToken(
                Issuer,
                audience: null,
                claims,
                notBefore: null,
                expires: SystemClock.Now.AddMinutes(20),
                SigningCredentials
            )
        );
    }
}
