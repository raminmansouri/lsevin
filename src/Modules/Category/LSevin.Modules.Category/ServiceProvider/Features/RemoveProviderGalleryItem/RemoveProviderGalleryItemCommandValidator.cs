using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderGalleryItem;

public sealed class RemoveProviderGalleryItemCommandValidator : AbstractValidator<RemoveProviderGalleryItemCommand>
{
    public RemoveProviderGalleryItemCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.GalleryItemId).ValidateGuid(CategoryResource.Service_Provider_Gallery);
    }
}
