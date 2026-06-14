using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetTrendingServicesQueryValidator : AbstractValidator<GetTrendingServicesQuery>
{
    public GetTrendingServicesQueryValidator()
    {
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
