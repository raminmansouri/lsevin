using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.VerifyEmail;

internal sealed class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(r => r.Email).ValidateEmail();
        RuleFor(r => r.Code).ValidateText(SharedResource.Code, minLength: 6);
    }
}
