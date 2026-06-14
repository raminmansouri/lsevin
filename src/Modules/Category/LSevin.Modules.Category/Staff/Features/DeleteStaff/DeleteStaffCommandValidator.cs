using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.DeleteStaff;

internal sealed class DeleteStaffCommandValidator : AbstractValidator<DeleteStaffCommand>
{
    public DeleteStaffCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);
    }
}
