using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffAvailability;

internal sealed class GetStaffAvailabilityQueryValidator : AbstractValidator<GetStaffAvailabilityQuery>
{
    public GetStaffAvailabilityQueryValidator()
    {
        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);
    }
}
