namespace LSevin.Tests.Shared.Auth;

/// <summary>
/// Mock for login user request.
/// </summary>
/// <param name="Email">The email.</param>
/// <param name="Password">The password.</param>
public sealed record LoginUserRequestMock(string Email, string Password);
