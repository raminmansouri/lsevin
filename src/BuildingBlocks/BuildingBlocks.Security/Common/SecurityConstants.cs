using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Persistence;

namespace BuildingBlocks.Security.Common;

/// <summary>
/// Represents constants for security.
/// </summary>
public static class SecurityConstants
{
    /// <summary>
    /// Represents the "Authorization" header.
    /// </summary>
    public const string Authorization = "Bearer";

    /// <summary>
    /// Represents the "Content-Security-Policy" header.
    /// </summary>
    public const string ContentSecurityPolicy = "Content-Security-Policy";

    /// <summary>
    /// Represents the value for the "Content-Security-Policy" header.
    /// </summary>
    public const string ContentSecurityPolicyValue = "script-src 'self' 'unsafe-inline'";

    /// <summary>
    /// Represents the "X-XSS-Protection" header.
    /// </summary>
    public const string XXssProtection = "X-XSS-Protection";

    /// <summary>
    /// Represents the value for the "X-XSS-Protection" header.
    /// </summary>
    public const string XXssProtectionValue = "1'";

    /// <summary>
    /// Defines constants for password.
    /// </summary>
    public static class Password
    {
        /// <summary>
        /// Specifies the size of salt.
        /// </summary>
        public const int SaltSize = 16;

        /// <summary>
        /// Specifies the size of password hash.
        /// </summary>
        public const int HashSize = 32;

        /// <summary>
        /// Specifies the number of iterations.
        /// </summary>
        public const int Iterations = 100_000;
    }

    /// <summary>
    /// Represents the Role constants.
    /// </summary>
    public static class Role
    {
        /// <summary>
        /// The user role.
        /// </summary>
        public const string User = "user";

        /// <summary>
        /// The admin role.
        /// </summary>
        public const string Admin = "admin";
    }
}
