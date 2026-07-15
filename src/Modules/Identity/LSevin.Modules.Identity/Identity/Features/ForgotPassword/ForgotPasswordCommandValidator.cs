using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.ForgotPassword;

internal sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.UserNameOrEmail).NotEmpty();
    }
}
