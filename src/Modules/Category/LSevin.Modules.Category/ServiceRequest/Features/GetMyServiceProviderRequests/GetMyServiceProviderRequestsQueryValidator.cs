using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetMyServiceProviderRequests;

internal sealed class GetMyServiceProviderRequestsQueryValidator : AbstractValidator<GetMyServiceProviderRequestsQuery>
{
    public GetMyServiceProviderRequestsQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
