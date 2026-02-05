using System.Dynamic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;
using WebMotions.Fake.Authentication.JwtBearer;

namespace LSevin.Tests.Shared.Extensions;

/// <summary>
/// Extensions for <see cref="HttpClient"/>.
/// </summary>
public static class HttpClientExtensions
{
    /// <summary>
    /// Set a fake bearer token in form of a JWT form the list of claims.
    /// </summary>
    /// <param name="client">The HTTP client.</param>
    /// <param name="roles">The roles to include.</param>
    /// <returns>The HTTP client with headers.</returns>
    public static HttpClient AddAuthClaims(this HttpClient client, params string[] roles)
    {
        dynamic data = new ExpandoObject();
        data.sub = IdGenerator.EmptyId;
        data.role = roles;
        client.SetFakeBearerToken((object)data);

        return client;
    }

    /// <summary>
    /// Set a fake bearer token in form of a JWT form the list of claims.
    /// </summary>
    /// <param name="client">The HTTP client.</param>
    /// <param name="claims">The claims.</param>
    /// <returns>The HTTP client with the fake bearer token.</returns>
    public static HttpClient SetFakeJwtBearerClaims(this HttpClient client, IEnumerable<Claim> claims)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = new JwtSecurityToken(claims: claims, expires: SystemClock.Now.AddDays(7));

        var jwt = tokenHandler.WriteToken(securityToken);
        return client.SetToken(FakeJwtBearerDefaults.AuthenticationScheme, jwt);
    }
}
