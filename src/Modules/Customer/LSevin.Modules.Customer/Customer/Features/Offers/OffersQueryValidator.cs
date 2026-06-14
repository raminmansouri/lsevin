using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class OffersQueryValidator : AbstractValidator<OffersQuery>
{
    public OffersQueryValidator()
    {
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
