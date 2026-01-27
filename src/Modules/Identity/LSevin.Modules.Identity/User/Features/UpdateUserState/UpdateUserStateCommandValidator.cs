using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.User.Features.UpdateUserState;

internal sealed class UpdateUserStateCommandValidator : AbstractValidator<UpdateUserStateCommand>
{
    public UpdateUserStateCommandValidator()
    {
        RuleFor(r => r.UserId).ValidateGuid(SharedResource.User);
        RuleFor(r => r.State).NotEmpty();
    }
}
