using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAddOns;

internal sealed class GetAddOnsQueryValidator : AbstractValidator<GetAddOnsQuery>
{
    public GetAddOnsQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
