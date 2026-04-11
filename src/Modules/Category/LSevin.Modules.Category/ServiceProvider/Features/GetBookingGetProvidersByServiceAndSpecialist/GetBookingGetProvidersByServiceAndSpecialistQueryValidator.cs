using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

internal sealed class GetBookingGetProvidersByServiceAndSpecialistQueryValidator : AbstractValidator<GetBookingGetProvidersByServiceAndSpecialistQuery>
{
    public GetBookingGetProvidersByServiceAndSpecialistQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
