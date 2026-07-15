using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Utils;
using BuildingBlocks.Security.Jwt.Models;
using BuildingBlocks.Security.Jwt.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BuildingBlocks.Security.Jwt.Services;

/// <summary>
/// JWT Service for handling JSON Web Tokens.
/// </summary>
internal sealed class JwtService(IOptions<JwtOptions> jwtOptions) : IJwtService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    /// <inheritdoc />
    public GenerateTokenResult GenerateJwtToken(
        string userName,
        string email,
        string userId,
        bool? isVerified = null,
        string? fullName = null,
        string? refreshToken = null,
        IReadOnlyList<Claim>? usersClaims = null,
        IReadOnlyList<string>? rolesClaims = null,
        IReadOnlyList<string>? permissionsClaims = null
    )
    {
        Guard.Against.NullOrEmpty(userName, nameof(userName));

        var now = SystemClock.Now;
        var ipAddress = IpUtilities.GetIpAddress();

        var jwtClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.NameId, userId),
            new(JwtRegisteredClaimNames.Name, fullName ?? ""),
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Sid, userId),
            new(JwtRegisteredClaimNames.UniqueName, userName),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.GivenName, fullName ?? ""),
            new(JwtRegisteredClaimNames.Jti, IdGenerator.NewId().ToString()),
            new(
                JwtRegisteredClaimNames.Iat,
                SystemClock.Now.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture)
            ),
            new(CustomClaimTypes.RefreshToken, refreshToken ?? ""),
            new(CustomClaimTypes.IpAddress, ipAddress),
        };

        if (rolesClaims?.Any() is true)
        {
            foreach (var role in rolesClaims)
                jwtClaims.Add(new Claim(ClaimTypes.Role, role.ToLower(CultureInfo.InvariantCulture)));
        }

        if (!string.IsNullOrWhiteSpace(_jwtOptions.Audience))
            jwtClaims.Add(new Claim(JwtRegisteredClaimNames.Aud, _jwtOptions.Audience));

        if (permissionsClaims?.Any() is true)
        {
            foreach (var permissionsClaim in permissionsClaims)
            {
                jwtClaims.Add(
                    new Claim(CustomClaimTypes.Permission, permissionsClaim.ToLower(CultureInfo.InvariantCulture))
                );
            }
        }

        if (usersClaims?.Any() is true)
            jwtClaims = jwtClaims.Union(usersClaims).ToList();

        Guard.Against.NullOrEmpty(_jwtOptions.SecretKey, nameof(_jwtOptions.SecretKey));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var expireTime = now.AddSeconds(_jwtOptions.TokenLifeTimeSecond == 0 ? 300 : _jwtOptions.TokenLifeTimeSecond);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new(ClaimTypes.Name, userId)]),
            Expires = expireTime,
            SigningCredentials = signingCredentials,
            Claims = jwtClaims.ConvertClaimsToDictionary(),
            Issuer = _jwtOptions.Issuer,
            // Audience = _jwtOptions.Audience,
            NotBefore = now,
        };

        var jwtSecurityTokenHandler = new JwtSecurityTokenHandler();
        jwtSecurityTokenHandler.OutboundClaimTypeMap.Clear();
        var securityToken = jwtSecurityTokenHandler.CreateToken(tokenDescriptor);
        var token = jwtSecurityTokenHandler.WriteToken(securityToken);

        return new GenerateTokenResult(token, expireTime);
    }

    /// <inheritdoc />
    public ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        Guard.Against.NullOrEmpty(token, nameof(token));
        Guard.Against.NullOrEmpty(_jwtOptions.SecretKey, nameof(_jwtOptions.SecretKey));

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = !string.IsNullOrWhiteSpace(_jwtOptions.Audience),
            ValidAudience = _jwtOptions.Audience,
            ValidateIssuer = true,
            ValidIssuer = _jwtOptions.Issuer,
            ValidateIssuerSigningKey = true,
#pragma warning disable CA5404
            ValidateLifetime = false,
#pragma warning restore CA5404
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey)),
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        var jwtSecurityToken = securityToken as JwtSecurityToken;

        if (jwtSecurityToken == null)
        {
            throw new SecurityTokenException("Invalid access token.");
        }

        return principal;
    }
}

/// <summary>
/// Represents the JWT helper.
/// </summary>
internal static class JwtHelper
{
    /// <summary>
    /// Converts the claims to dictionary.
    /// </summary>
    /// <param name="claims">The claims.</param>
    /// <returns>The dictionary.</returns>
    public static IDictionary<string, object> ConvertClaimsToDictionary(this IList<Claim> claims)
    {
        // A claim type can legitimately repeat (e.g. a user with multiple roles). Group by type
        // so duplicates become a JSON array value instead of throwing "same key already added".
        return claims
            .GroupBy(claim => claim.Type)
            .ToDictionary(
                group => group.Key,
                group =>
                    group.Count() == 1
                        ? (object)group.First().Value
                        : group.Select(claim => claim.Value).ToArray()
            );
    }
}
