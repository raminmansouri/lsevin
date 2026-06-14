namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// Mock for login response.
/// </summary>
public sealed class LoginResponseMock
{
    /// <summary>
    /// Gets or sets the access token.
    /// </summary>
    public string RefreshToken { get; set; } = null!;

    /// <summary>
    /// Gets or sets the access token.
    /// </summary>
    public string AccessToken { get; set; } = null!;
}
