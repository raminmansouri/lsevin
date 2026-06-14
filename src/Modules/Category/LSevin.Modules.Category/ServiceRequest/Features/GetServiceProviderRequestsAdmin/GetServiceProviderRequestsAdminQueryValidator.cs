using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsAdmin;

internal sealed class GetServiceProviderRequestsAdminQueryValidator
    : AbstractValidator<GetServiceProviderRequestsAdminQuery>
{
    public GetServiceProviderRequestsAdminQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
