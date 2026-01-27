using System.Security.Cryptography;
using BuildingBlocks.Security.Common;

namespace BuildingBlocks.Security.Password.Services;

/// <summary>
/// Represents a password manager.
/// </summary>
internal sealed class PasswordManager : IPasswordManager
{
    /// <summary>
    /// The hashing algorithm.
    /// </summary>
    private static readonly HashAlgorithmName _algorithm = HashAlgorithmName.SHA512;

    /// <inheritdoc />
    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SecurityConstants.Password.SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: SecurityConstants.Password.Iterations,
            hashAlgorithm: _algorithm,
            outputLength: SecurityConstants.Password.HashSize
        );

        return $"{Convert.ToHexString(hash)}:{Convert.ToHexString(salt)}";
    }

    /// <inheritdoc />
    public bool VerifyPassword(string password, string hashedPassword)
    {
        var parts = hashedPassword.Split(':');
        var hash = Convert.FromHexString(parts[0]);
        var salt = Convert.FromHexString(parts[1]);

        var inputHash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: SecurityConstants.Password.Iterations,
            hashAlgorithm: _algorithm,
            outputLength: SecurityConstants.Password.HashSize
        );
        return CryptographicOperations.FixedTimeEquals(left: hash, right: inputHash);
    }
}
