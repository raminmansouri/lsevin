using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetNotificationCountQueryValidator : AbstractValidator<GetNotificationCountQuery>
{
    public GetNotificationCountQueryValidator()
    {
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
