using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderPolicies;

internal sealed class GetServiceProviderPoliciesQueryValidator : AbstractValidator<GetServiceProviderPoliciesQuery>
{
    public GetServiceProviderPoliciesQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
