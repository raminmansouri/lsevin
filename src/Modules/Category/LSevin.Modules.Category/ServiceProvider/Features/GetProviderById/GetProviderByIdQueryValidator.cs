using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;

internal sealed class GetProviderByIdQueryValidator : AbstractValidator<GetProviderByIdQuery>
{
    public GetProviderByIdQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
