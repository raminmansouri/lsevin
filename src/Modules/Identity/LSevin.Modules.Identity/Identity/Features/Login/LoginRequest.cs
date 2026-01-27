namespace LSevin.Modules.Identity.Identity.Features.Login;

internal sealed record LoginRequest(string UserNameOrEmail, string Password, bool Remember);
