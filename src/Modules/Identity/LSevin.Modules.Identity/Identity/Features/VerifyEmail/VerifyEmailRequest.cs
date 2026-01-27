namespace LSevin.Modules.Identity.Identity.Features.VerifyEmail;

internal sealed record VerifyEmailRequest(string Email, string Code);
