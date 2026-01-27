using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderStaff;

public sealed class UpdateProviderStaffCommandValidator : AbstractValidator<UpdateProviderStaffCommand>
{
    public UpdateProviderStaffCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.StaffId).ValidateGuid(CategoryResource.Staff);

        RuleFor(x => x.Notes).ValidateLocalizedContent(CategoryResource.Staff_Service_Notes);
    }
}
