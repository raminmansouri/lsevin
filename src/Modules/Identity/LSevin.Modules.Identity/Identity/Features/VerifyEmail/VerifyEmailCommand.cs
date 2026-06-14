using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.VerifyEmail;

internal sealed record VerifyEmailCommand(string Email, string Code) : Command<bool>;
