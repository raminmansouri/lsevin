using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

internal sealed class GetBookingAvailableTimesQueryValidator : AbstractValidator<GetBookingAvailableTimesQuery>
{
    public GetBookingAvailableTimesQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
