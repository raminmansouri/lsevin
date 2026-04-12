using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

internal sealed class GetBookingAvailableDatesQueryValidator : AbstractValidator<GetBookingAvailableDatesQuery>
{
    public GetBookingAvailableDatesQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
