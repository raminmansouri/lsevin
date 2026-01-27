using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderStaff;

public sealed class RemoveProviderStaffCommandValidator : AbstractValidator<RemoveProviderStaffCommand>
{
    public RemoveProviderStaffCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);
    }
}
