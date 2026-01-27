using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffServices;

internal sealed class GetStaffServicesQueryValidator : AbstractValidator<GetStaffServicesQuery>
{
    public GetStaffServicesQueryValidator()
    {
        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);
    }
}
