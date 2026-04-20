using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderPageData;

internal sealed class GetProviderPageDataQueryValidator : AbstractValidator<GetProviderPageDataQuery>
{
    public GetProviderPageDataQueryValidator()
    {
        RuleFor(x => x.Id).ValidateGuid(CategoryResource.Service_Provider);
    }
}
