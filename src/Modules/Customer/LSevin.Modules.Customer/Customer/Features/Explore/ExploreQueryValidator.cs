using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class ExploreQueryValidator : AbstractValidator<ExploreQuery>
{
    public ExploreQueryValidator()
    {
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
