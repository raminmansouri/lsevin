using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderGalleryItem;

public sealed class UpdateProviderGalleryItemCommandValidator : AbstractValidator<UpdateProviderGalleryItemCommand>
{
    public UpdateProviderGalleryItemCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.GalleryItemId).ValidateGuid("Gallery Item");

        // File is optional for update - only validate if provided
        When(
            x => x.File is not null,
            () =>
            {
                RuleFor(r => r.File!).Must(file => file.Length > 0);
            }
        );

        RuleFor(x => x.Title).ValidateText(CategoryResource.Service_Provider_Gallery);

        RuleFor(x => x.Description).ValidateText(CategoryResource.Service_Provider_Gallery, nullable: true);

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}
