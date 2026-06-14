namespace LSevin.Tests.Shared;

/// <summary>
/// Constants for integration tests.
/// </summary>
public static class Constants
{
    /// <summary>
    /// The timeouts.
    /// </summary>
    public static class Timeouts
    {
        /// <summary>
        /// The default timeout for waiting operations (5 seconds).
        /// </summary>
        public const int DefaultTimeoutMs = 5_000;

        /// <summary>
        /// The polling interval for checking conditions (50ms).
        /// </summary>
        public const int DefaultPollingIntervalMs = 50;

        /// <summary>
        /// Shorter timeout for quick operations (2 seconds).
        /// </summary>
        public const int QuickTimeoutMs = 2_000;

        /// <summary>
        /// Longer timeout for complex operations (10 seconds).
        /// </summary>
        public const int ExtendedTimeoutMs = 10_000;

        /// <summary>
        /// Very short polling for time-critical checks (20ms).
        /// </summary>
        public const int QuickPollingMs = 20;
    }

    /// <summary>
    /// Represents the user constants.
    /// </summary>
    public static class Users
    {
        /// <summary>
        /// Admin user.
        /// </summary>
        public static class Admin
        {
            public const string UserId = "4073f0f0-855a-48e6-9168-d4e20f1d2839";
            public const string UserName = "admin";
            public const string Email = "admin@test.com";
            public const string Password = "123456";
            public const string Role = "admin";
        }

        /// <summary>
        /// Normal user.
        /// </summary>
        public static class NormalUser
        {
            public const string UserId = "5073f0f0-855a-48e6-9168-d4e20f1d2840";
            public const string UserName = "pourya";
            public const string Email = "pouryanoufallah@test.com";
            public const string Password = "123456";
            public const string Role = "";
        }
    }

    /// <summary>
    /// The login API.
    /// </summary>
    public static class AuthConstants
    {
        public const string Scheme = "TestAuth";
    }
}
