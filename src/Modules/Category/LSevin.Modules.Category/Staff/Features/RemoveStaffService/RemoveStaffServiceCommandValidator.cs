using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffService;

internal sealed class RemoveStaffServiceCommandValidator : AbstractValidator<RemoveStaffServiceCommand>
{
    public RemoveStaffServiceCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);

        RuleFor(x => x.ServiceId).NotEmpty().WithMessage(CategoryResource.Service_Definition);
    }
}
