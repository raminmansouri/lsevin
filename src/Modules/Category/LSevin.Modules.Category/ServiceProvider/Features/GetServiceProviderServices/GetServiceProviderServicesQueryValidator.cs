using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderServices;

internal sealed class GetServiceProviderServicesQueryValidator : AbstractValidator<GetServiceProviderServicesQuery>
{
    public GetServiceProviderServicesQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
