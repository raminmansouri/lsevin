using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderById;

internal sealed class GetServiceProviderByIdQueryValidator : AbstractValidator<GetServiceProviderByIdQuery>
{
    public GetServiceProviderByIdQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
