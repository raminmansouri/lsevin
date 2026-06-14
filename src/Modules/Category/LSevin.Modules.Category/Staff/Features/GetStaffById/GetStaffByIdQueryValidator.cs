using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffById;

internal sealed class GetStaffByIdQueryValidator : AbstractValidator<GetStaffByIdQuery>
{
    public GetStaffByIdQueryValidator()
    {
        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);
    }
}
