using BuildingBlocks.Validation.Common;
using FluentValidation;

namespace LSevin.Modules.Category.Staff.Features.GetStaff;

internal sealed class GetStaffQueryValidator : AbstractValidator<GetStaffQuery>
{
    public GetStaffQueryValidator()
    {
        Include(new PageRequestValidator());
    }
}
