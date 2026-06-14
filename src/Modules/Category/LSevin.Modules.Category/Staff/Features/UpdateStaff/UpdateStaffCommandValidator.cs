using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaff;

internal sealed class UpdateStaffCommandValidator : AbstractValidator<UpdateStaffCommand>
{
    public UpdateStaffCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty().WithMessage(CategoryResource.Staff);

        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Staff_Name);

        RuleFor(x => x.Biography).ValidateLocalizedContent(CategoryResource.Staff_Biography);

        RuleFor(x => x.Title).ValidateLocalizedContent(CategoryResource.Staff_Title);

        RuleFor(x => x.ProfileImageUrl)
            .ValidateText(
                CategoryResource.Staff_ProfileImageUrl,
                maxLength: DomainConstValues.StaffProfileImageUrlMaxLength,
                nullable: true
            );

        RuleFor(x => x.ProfileImageUrl)
            .ValidateText(
                CategoryResource.Staff_ProfileImageUrl,
                maxLength: DomainConstValues.StaffProfileImageUrlMaxLength,
                nullable: true
            );
    }
}
