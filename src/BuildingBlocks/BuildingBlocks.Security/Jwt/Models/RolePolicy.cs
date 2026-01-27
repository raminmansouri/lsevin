namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the role policy.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="RolePolicy"/> class.
/// </remarks>
/// <param name="name">The name of the role policy.</param>
/// <param name="roles">The roles.</param>
public sealed class RolePolicy(string name, IReadOnlyList<string>? roles)
{
    /// <summary>
    /// Gets the name of the role policy.
    /// </summary>
    public string Name { get; init; } = name;

    /// <summary>
    /// Gets the roles.
    /// </summary>
    public IReadOnlyList<string> Roles { get; init; } = roles ?? [];
}
