using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetBookingByIdQueryValidator : AbstractValidator<GetBookingByIdQuery>
{
    public GetBookingByIdQueryValidator()
    {
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
