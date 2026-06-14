using BuildingBlocks.Core.Generators;
using BuildingBlocks.Security.Jwt.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Security.Jwt.Services;

/// <summary>
/// Service class for managing user identity.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="UserAccessor"/> class.
/// </remarks>
/// <param name="context">The IHttpContextAccessor.</param>
public sealed class UserAccessor(IHttpContextAccessor context) : IUserAccessor
{
    /// <inheritdoc />
    public Guid GetUserIdentity => context.HttpContext?.User.GetUserIdentity() ?? IdGenerator.EmptyId;

    /// <inheritdoc />
    public bool IsAuthenticated => context.HttpContext?.User.IsAuthenticated() ?? false;

    /// <inheritdoc />
    public string GetUserEmail => context.HttpContext?.User.GetUserEmail() ?? string.Empty;

    /// <inheritdoc />
    public string GetUserFullName => context.HttpContext?.User.GetUserFullName() ?? string.Empty;
}
