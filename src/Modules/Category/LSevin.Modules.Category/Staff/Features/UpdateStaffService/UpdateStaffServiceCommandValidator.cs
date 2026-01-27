using FluentValidation;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffService;

internal sealed class UpdateStaffServiceCommandValidator : AbstractValidator<UpdateStaffServiceCommand>
{
    public UpdateStaffServiceCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty();

        RuleFor(x => x.ServiceId).NotEmpty();

        RuleFor(x => x.Notes).NotNull();
    }
}
