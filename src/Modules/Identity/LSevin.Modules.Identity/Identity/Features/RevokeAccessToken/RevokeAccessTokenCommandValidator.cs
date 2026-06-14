using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.RevokeAccessToken;

internal sealed class RevokeAccessTokenCommandValidator : AbstractValidator<RevokeAccessTokenCommand>
{
    public RevokeAccessTokenCommandValidator()
    {
        RuleFor(r => r.Token).NotEmpty();
        RuleFor(r => r.UserName).NotEmpty();
    }
}
