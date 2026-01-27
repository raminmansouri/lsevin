using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Identity.Resources;

namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(r => r.AccessTokenData).ValidateText(IdentityResource.Token);
        RuleFor(r => r.RefreshTokenData).ValidateText(IdentityResource.Token);
    }
}
