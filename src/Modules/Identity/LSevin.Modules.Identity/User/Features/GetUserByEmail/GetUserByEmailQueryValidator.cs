using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.User.Features.GetUserByEmail;

internal sealed class GetUserByEmailQueryValidator : AbstractValidator<GetUserByEmailQuery>
{
    public GetUserByEmailQueryValidator()
    {
        RuleFor(x => x.Email).ValidateEmail();
    }
}
