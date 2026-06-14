using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// A test authentication handler for integration tests.
/// </summary>
/// <remarks>
/// This is a copy of the <see cref="TestAuthenticationHandler"/> class.
/// </remarks>
/// <seealso cref="TestAuthenticationHandler"/>
/// <param name="options">The options.</param>
/// <param name="logger">The logger.</param>
/// <param name="encoder">The encoder.</param>
/// <param name="mockAuthUser">The mock auth user.</param>
public sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    MockAuthUser mockAuthUser
) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    /// <inheritdoc/>
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (mockAuthUser.Claims.Count == 0)
        {
            return Task.FromResult(AuthenticateResult.Fail("Mock auth user not configured."));
        }

        var identity = new ClaimsIdentity(mockAuthUser.Claims, Constants.AuthConstants.Scheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Constants.AuthConstants.Scheme);

        var result = AuthenticateResult.Success(ticket);
        return Task.FromResult(result);
    }
}
