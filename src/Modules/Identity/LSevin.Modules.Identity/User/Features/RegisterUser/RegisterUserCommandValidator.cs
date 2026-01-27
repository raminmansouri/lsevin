using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Resources;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        Include(new UserDtoValidator());

        RuleFor(r => r.Password).ValidateText(SharedResource.Password);

        RuleFor(r => r.ConfirmPassword)
            .ValidateText(SharedResource.Password)
            .Equal(r => r.Password)
            .WithMessage(IdentityResource.Password_Match_Error_Message);

        RuleFor(v => v.Roles)
            .Custom(
                (roles, c) =>
                {
                    if (
                        roles?.All(x =>
                            x.Contains(IdentityConstants.Role.Admin, StringComparison.Ordinal)
                            || x.Contains(IdentityConstants.Role.User, StringComparison.Ordinal)
                        ) == false
                    )
                    {
                        c.AddFailure(SharedResource.Validation_Error_Message);
                    }
                }
            );
    }
}
