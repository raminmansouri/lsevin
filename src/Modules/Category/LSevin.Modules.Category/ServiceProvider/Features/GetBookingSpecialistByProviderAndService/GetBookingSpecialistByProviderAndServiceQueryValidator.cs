using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed class GetBookingSpecialistByProviderAndServiceQueryValidator : AbstractValidator<GetBookingSpecialistByProviderAndServiceQuery>
{
    public GetBookingSpecialistByProviderAndServiceQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
