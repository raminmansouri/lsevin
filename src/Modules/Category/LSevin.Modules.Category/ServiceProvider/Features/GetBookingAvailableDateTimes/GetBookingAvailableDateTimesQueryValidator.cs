using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDateTimes;

internal sealed class GetBookingAvailableDateTimesQueryValidator : AbstractValidator<GetBookingAvailableDateTimesQuery>
{
    public GetBookingAvailableDateTimesQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
