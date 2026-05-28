using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchResultsQueryValidator : AbstractValidator<GetSearchResultsQuery>
{
    public GetSearchResultsQueryValidator()
    {
<<<<<<< HEAD
       
           RuleFor(x => x.term).NotEmpty();
=======
       // RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    }
}
