using Ardalis.GuardClauses;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Resources;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.VerifyEmail;

internal sealed class VerifyEmailCommandHandler(UserManager<ApplicationUser> userManager, IdentityContext dbContext)
    : CommandHandler<VerifyEmailCommand, bool>
{
    public override async Task<Result<bool>> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        Guard.Against.Null(request, nameof(request));

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return AppError.NotFoundErrorMessage(SharedResource.Email);

        if (user.EmailConfirmed)
            AppError.ApplicationErrorMessage(IdentityResource.Email_Already_Confirmed_Error_Message);

        var emailVerificationCode = await dbContext
            .Set<EmailVerificationCode>()
            .Where(x => x.Email == request.Email && x.Code == request.Code && x.UsedAt == null)
            .SingleOrDefaultAsync(cancellationToken: cancellationToken);

        if (emailVerificationCode is null)
        {
            return AppError.ApplicationErrorMessage(IdentityResource.Email_Verification_Invalid_Error_Message);
        }

        var now = SystemClock.Now;
        if (now > emailVerificationCode.SentAt.AddMinutes(5))
        {
            return AppError.ApplicationErrorMessage(IdentityResource.Verification_Code_Expired_Error_Message);
        }

        user.EmailConfirmed = true;
        await userManager.UpdateAsync(user);

        emailVerificationCode.UsedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
