using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Identity.Resources;

namespace LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;

internal sealed class GenerateJwtTokenCommandValidator : AbstractValidator<GenerateJwtTokenCommand>
{
    public GenerateJwtTokenCommandValidator()
    {
        RuleFor(r => r.User).NotNull().WithMessage(AppError.RequiredMessage(SharedResource.User));

        RuleFor(r => r.RefreshToken).ValidateText(IdentityResource.Token);
    }
}
