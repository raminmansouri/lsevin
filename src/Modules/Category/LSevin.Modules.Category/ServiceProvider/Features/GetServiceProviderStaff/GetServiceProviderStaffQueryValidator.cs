using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderStaff;

internal sealed class GetServiceProviderStaffQueryValidator : AbstractValidator<GetServiceProviderStaffQuery>
{
    public GetServiceProviderStaffQueryValidator()
    {
        RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
