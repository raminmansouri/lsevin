using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Enumerations;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffAvailability;

internal sealed class UpdateStaffAvailabilityCommandValidator : AbstractValidator<UpdateStaffAvailabilityCommand>
{
    public UpdateStaffAvailabilityCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);

        RuleFor(x => x.AvailabilityId).NotEmpty().WithMessage(CategoryResource.Staff_Availability_Status);

        RuleFor(x => x.StartTime)
            .LessThan(x => x.EndTime)
            .WithMessage(CategoryResource.Staff_Availability_End_Time_Must_Be_After_Start_Time_Error_Message);

        RuleFor(x => x.AvailabilityStatusId)
            .MustBeValidEnumeration<UpdateStaffAvailabilityCommand, StaffAvailabilityStatus>(
                CategoryResource.Staff_Availability_Status
            );

        RuleFor(x => x.SpecificDate)
            .NotNull()
            .When(x => !x.IsRecurring)
            .WithMessage(CategoryResource.Staff_NonRecurring_Availability_Requires_Date_Error_Message);
    }
}
