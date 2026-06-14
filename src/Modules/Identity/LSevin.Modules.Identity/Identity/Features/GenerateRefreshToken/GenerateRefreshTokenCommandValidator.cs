using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;

internal sealed class GenerateRefreshTokenCommandValidator : AbstractValidator<GenerateRefreshTokenCommand>
{
    public GenerateRefreshTokenCommandValidator()
    {
        RuleFor(r => r.UserId).ValidateGuid(SharedResource.User);
    }
}
