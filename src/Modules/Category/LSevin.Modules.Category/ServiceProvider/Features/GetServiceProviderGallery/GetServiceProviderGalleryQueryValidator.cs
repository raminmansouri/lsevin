using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderGallery;

internal sealed class GetServiceProviderGalleryQueryValidator : AbstractValidator<GetServiceProviderGalleryQuery>
{
    public GetServiceProviderGalleryQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
