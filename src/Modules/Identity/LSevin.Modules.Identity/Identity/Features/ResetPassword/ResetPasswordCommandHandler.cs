using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.ResetPassword;

internal sealed class ResetPasswordCommandHandler(IdentityContext context, UserManager<ApplicationUser> userManager)
    : CommandHandler<ResetPasswordCommand, ResetPasswordResponse>
{
    private const string InvalidCodeMessage = "Invalid or expired reset code.";

    public override async Task<Result<ResetPasswordResponse>> Handle(
        ResetPasswordCommand command,
        CancellationToken cancellationToken
    )
    {
        var user =
            await userManager.FindUserWithRoleByPhoneNumberAsync(
                command.UserNameOrEmail,
                cancellationToken: cancellationToken
            ) ?? await userManager.FindByEmailAsync(command.UserNameOrEmail);

        if (user is null || string.IsNullOrEmpty(user.Email))
        {
            return AppError.ApplicationErrorMessage(InvalidCodeMessage);
        }

        var earliestValidSentAt = SystemClock.Now.AddMinutes(-DomainConstValues.PasswordResetCodeExpirationMinutes);

        var resetCode = await context
            .Set<PasswordResetCode>()
            .Where(c =>
                c.Email == user.Email
                && c.Code == command.Code
                && c.UsedAt == null
                && c.SentAt > earliestValidSentAt
            )
            .OrderByDescending(c => c.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (resetCode is null)
        {
            return AppError.ApplicationErrorMessage(InvalidCodeMessage);
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, command.NewPassword);

        if (!resetResult.Succeeded)
        {
            return AppError.ApplicationErrorMessage(resetResult.Errors.First().Description);
        }

        resetCode.UsedAt = SystemClock.Now;
        await context.SaveChangesAsync(cancellationToken);

        return new ResetPasswordResponse("Your password has been reset successfully.");
    }
}
