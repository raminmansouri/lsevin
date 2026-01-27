using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderGalleryItem;

public sealed class AddProviderGalleryItemCommandValidator : AbstractValidator<AddProviderGalleryItemCommand>
{
    public AddProviderGalleryItemCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(r => r.File).NotNull();

        RuleFor(x => x.Title).ValidateText(CategoryResource.Service_Provider_Gallery);

        RuleFor(x => x.Description).ValidateText(CategoryResource.Service_Provider_Gallery, nullable: true);
    }
}
