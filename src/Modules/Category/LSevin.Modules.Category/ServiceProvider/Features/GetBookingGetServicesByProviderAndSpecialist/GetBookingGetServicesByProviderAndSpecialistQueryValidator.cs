using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed class GetBookingGetServicesByProviderAndSpecialistQueryValidator : AbstractValidator<GetBookingGetServicesByProviderAndSpecialistQuery>
{
    public GetBookingGetServicesByProviderAndSpecialistQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
