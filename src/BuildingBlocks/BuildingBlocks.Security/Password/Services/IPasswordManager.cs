namespace BuildingBlocks.Security.Password.Services;

/// <summary>
/// Defines a contract for a password manager.
/// </summary>
public interface IPasswordManager
{
    /// <summary>
    /// Hashes the specified password.
    /// </summary>
    /// <param name="password">The password to hash.</param>
    /// <returns>The hashed password.</returns>
    public string HashPassword(string password);

    /// <summary>
    /// Verifies the specified password.
    /// </summary>
    /// <param name="password">The password to verify.</param>
    /// <param name="hashedPassword">The hashed password.</param>
    /// <returns>A value indicating whether the password is valid.</returns>
    public bool VerifyPassword(string password, string hashedPassword);
}
