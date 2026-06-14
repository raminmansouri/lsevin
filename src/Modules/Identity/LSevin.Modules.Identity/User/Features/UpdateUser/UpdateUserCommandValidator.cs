using FluentValidation;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.UpdateUser;

internal sealed class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        Include(new UserDtoValidator());
    }
}
