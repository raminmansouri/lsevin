using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.ForgotPassword;

internal sealed record ForgotPasswordCommand(string UserNameOrEmail) : Command<ForgotPasswordResponse>;
