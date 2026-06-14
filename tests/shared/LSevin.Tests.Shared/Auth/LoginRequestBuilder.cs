namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// Represents a login request builder.
/// </summary>
public class LoginRequestBuilder
{
    /// <summary>
    /// Gets or sets the email.
    /// </summary>
    private string _email = "pouryanoufallah@yahoo.com";

    /// <summary>
    /// Gets or sets the password.
    /// </summary>
    private string _password = "123456";

    /// <summary>
    /// Withs the email.
    /// </summary>
    /// <param name="email">The email.</param>
    /// <returns>The <see cref="LoginRequestBuilder"/>.</returns>
    public LoginRequestBuilder WithEmail(string email)
    {
        _email = email;
        return this;
    }

    /// <summary>
    /// Withs the password.
    /// </summary>
    /// <param name="password">The password.</param>
    /// <returns>The <see cref="LoginRequestBuilder"/>.</returns>
    public LoginRequestBuilder WithPassword(string password)
    {
        _password = password;
        return this;
    }

    /// <summary>
    /// Builds the login user request mock.
    /// </summary>
    /// <returns>The login user request mock.</returns>
    public LoginUserRequestMock Build()
    {
        return new LoginUserRequestMock(_email, _password);
    }
}
