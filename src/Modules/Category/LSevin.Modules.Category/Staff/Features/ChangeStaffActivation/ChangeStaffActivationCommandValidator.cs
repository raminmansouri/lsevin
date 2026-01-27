using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.ChangeStaffActivation;

internal sealed class ChangeStaffActivationCommandValidator : AbstractValidator<ChangeStaffActivationCommand>
{
    public ChangeStaffActivationCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);
    }
}
