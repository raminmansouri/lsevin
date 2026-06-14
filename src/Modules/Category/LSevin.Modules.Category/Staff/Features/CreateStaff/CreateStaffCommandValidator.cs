using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.CreateStaff;

internal sealed class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator()
    {
        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Staff_Name);

        RuleFor(x => x.Biography).ValidateLocalizedContent(CategoryResource.Staff_Biography);

        RuleFor(x => x.Title).ValidateLocalizedContent(CategoryResource.Staff_Title);

        RuleFor(x => x.ProfileImageUrl)
            .ValidateText(
                CategoryResource.Staff_ProfileImageUrl,
                maxLength: DomainConstValues.StaffProfileImageUrlMaxLength,
                nullable: true
            );
    }
}
