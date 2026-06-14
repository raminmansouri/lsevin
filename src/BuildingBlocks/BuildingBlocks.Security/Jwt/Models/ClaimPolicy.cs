using System.Security.Claims;

namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the claim policy.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ClaimPolicy"/> class.
/// </remarks>
/// <param name="name">The name of the claim policy.</param>
/// <param name="claims">The claims.</param>
public sealed class ClaimPolicy(string name, IReadOnlyList<Claim>? claims)
{
    /// <summary>
    /// Gets the name of the claim policy.
    /// </summary>
    public string Name { get; init; } = name;

    /// <summary>
    /// Gets the claims.
    /// </summary>
    public IReadOnlyList<Claim> Claims { get; init; } = claims ?? [];
}
