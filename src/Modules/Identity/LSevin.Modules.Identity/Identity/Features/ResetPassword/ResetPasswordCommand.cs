using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.ResetPassword;

internal sealed record ResetPasswordCommand(
    string UserNameOrEmail,
    string Code,
    string NewPassword,
    string ConfirmPassword
) : Command<ResetPasswordResponse>;
