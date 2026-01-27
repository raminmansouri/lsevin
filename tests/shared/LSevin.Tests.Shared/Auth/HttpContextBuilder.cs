using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// Builder for creating and configuring HttpContext in tests.
/// </summary>
public class HttpContextBuilder
{
    private readonly HttpContext _httpContext;
    private readonly Dictionary<object, object?> _items;
    private readonly List<Claim> _claims;

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpContextBuilder"/> class.
    /// </summary>
    public HttpContextBuilder()
    {
        _httpContext = Substitute.For<HttpContext>();
        _items = [];
        _claims = [];
    }

    /// <summary>
    /// Adds claims for an admin user.
    /// </summary>
    /// <returns>The builder instance.</returns>
    public HttpContextBuilder WithAdminUser()
    {
        var roleClaim = new Claim(ClaimTypes.Role, Constants.Users.Admin.Role);
        _claims.Add(roleClaim);
        _claims.AddRange(
            [
                new Claim(ClaimTypes.NameIdentifier, Constants.Users.Admin.UserId),
                new Claim(ClaimTypes.Name, Constants.Users.Admin.UserName),
                new Claim(ClaimTypes.Email, Constants.Users.Admin.Email),
            ]
        );

        return this;
    }

    /// <summary>
    /// Adds claims for a normal user.
    /// </summary>
    /// <returns>The builder instance.</returns>
    public HttpContextBuilder WithNormalUser()
    {
        _claims.AddRange(
            [
                new Claim(ClaimTypes.NameIdentifier, Constants.Users.NormalUser.UserId),
                new Claim(ClaimTypes.Name, Constants.Users.NormalUser.UserName),
                new Claim(ClaimTypes.Email, Constants.Users.NormalUser.Email),
            ]
        );

        return this;
    }

    /// <summary>
    /// Adds a custom item to the HttpContext.Items collection.
    /// </summary>
    /// <param name="key">The key for the item.</param>
    /// <param name="value">The value to store.</param>
    /// <returns>The builder instance.</returns>
    public HttpContextBuilder WithItem(object key, object? value)
    {
        _items[key] = value;
        return this;
    }

    /// <summary>
    /// Adds custom claims to the user.
    /// </summary>
    /// <param name="claims">The claims to add.</param>
    /// <returns>The builder instance.</returns>
    public HttpContextBuilder WithClaims(params IList<Claim>[] claims)
    {
        _claims.AddRange(claims.SelectMany(c => c));
        return this;
    }

    /// <summary>
    /// Builds the HttpContext and sets it on the provided HttpContextAccessor.
    /// </summary>
    /// <param name="httpContextAccessor">The HttpContextAccessor to configure.</param>
    public void Build(IHttpContextAccessor httpContextAccessor)
    {
        if (_claims.Count != 0)
        {
            var identity = new ClaimsIdentity(_claims);
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _httpContext.User.Returns(claimsPrincipal);
        }

        _httpContext.Items.Returns(_items);
        httpContextAccessor.HttpContext = _httpContext;
    }
}
