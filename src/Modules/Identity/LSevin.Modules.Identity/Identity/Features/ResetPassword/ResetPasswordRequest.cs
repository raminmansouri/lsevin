namespace LSevin.Modules.Identity.Identity.Features.ResetPassword;

internal sealed record ResetPasswordRequest(
    string UserNameOrEmail,
    string Code,
    string NewPassword,
    string ConfirmPassword
);
