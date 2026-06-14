namespace BuildingBlocks.Security.Jwt.Services;

/// <summary>
/// Provides an interface for managing user identity.
/// </summary>
public interface IUserAccessor
{
    /// <summary>
    /// Gets retrieves the user identity from the current context.
    /// </summary>
    Guid GetUserIdentity { get; }

    /// <summary>
    /// Gets a value indicating whether retrieves the user authentication status from the current context.
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Gets retrieves the user email from the current context.
    /// </summary>
    string GetUserEmail { get; }

    /// <summary>
    /// Gets retrieves the user full name from the current context.
    /// </summary>
    string GetUserFullName { get; }
}
