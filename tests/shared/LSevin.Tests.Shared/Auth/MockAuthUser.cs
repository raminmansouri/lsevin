using System.Security.Claims;

namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// The mock auth user.
/// </summary>
public sealed class MockAuthUser(params Claim[] claims)
{
    /// <summary>
    /// Gets the list of claims.
    /// </summary>
    public IList<Claim> Claims { get; } = [.. claims];
}
