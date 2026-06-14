using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffDetails;

internal sealed class GetStaffDetailsQueryValidator : AbstractValidator<GetStaffDetailsQuery>
{
    public GetStaffDetailsQueryValidator()
    {
        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);
    }
}
