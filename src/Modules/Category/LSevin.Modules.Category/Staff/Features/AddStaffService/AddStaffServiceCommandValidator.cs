using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.AddStaffService;

internal sealed class AddStaffServiceCommandValidator : AbstractValidator<AddStaffServiceCommand>
{
    public AddStaffServiceCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);

        RuleFor(x => x.ServiceDefinitionId).NotEmpty().WithMessage(CategoryResource.Service_Definition);

        RuleFor(x => x.Notes).ValidateLocalizedContent(CategoryResource.Staff_Service_Notes);
    }
}
