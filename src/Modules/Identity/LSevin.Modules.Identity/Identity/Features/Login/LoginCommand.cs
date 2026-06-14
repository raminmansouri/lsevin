using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.Login;

/// <summary>
/// Represents the login command.
/// </summary>
/// <param name="UserNameOrEmail">The username or email.</param>
/// <param name="Password">The password.</param>
/// <param name="Remember">Indicates if the user should be remembered.</param>
internal sealed record LoginCommand(string UserNameOrEmail, string Password, bool Remember) : Command<LoginResponse>;
