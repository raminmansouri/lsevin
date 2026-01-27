using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.Login;

internal sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.UserNameOrEmail)
            .ValidateText(SharedResource.Username, minLength: GlobalDomainConstValues.EmailMinLength);

        RuleFor(x => x.Password)
            .ValidateText(SharedResource.Password, minLength: GlobalDomainConstValues.PasswordMinLength);
    }
}
