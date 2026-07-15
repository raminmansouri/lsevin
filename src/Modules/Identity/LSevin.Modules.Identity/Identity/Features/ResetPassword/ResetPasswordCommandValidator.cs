using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Identity.Resources;

namespace LSevin.Modules.Identity.Identity.Features.ResetPassword;

internal sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.UserNameOrEmail).NotEmpty();

        RuleFor(x => x.Code).NotEmpty();

        RuleFor(x => x.NewPassword).ValidateText(SharedResource.Password);

        RuleFor(x => x.ConfirmPassword)
            .ValidateText(SharedResource.Password)
            .Equal(x => x.NewPassword)
            .WithMessage(IdentityResource.Password_Match_Error_Message);
    }
}
