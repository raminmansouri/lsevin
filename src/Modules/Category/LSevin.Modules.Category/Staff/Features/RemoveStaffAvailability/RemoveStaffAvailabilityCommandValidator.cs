using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffAvailability;

internal sealed class RemoveStaffAvailabilityCommandValidator : AbstractValidator<RemoveStaffAvailabilityCommand>
{
    public RemoveStaffAvailabilityCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);

        RuleFor(x => x.AvailabilityId).NotEmpty().WithMessage(CategoryResource.Staff_Availability_Status);
    }
}
