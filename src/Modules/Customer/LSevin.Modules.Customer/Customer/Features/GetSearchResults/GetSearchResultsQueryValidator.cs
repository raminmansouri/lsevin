using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchResultsQueryValidator : AbstractValidator<GetSearchResultsQuery>
{
    public GetSearchResultsQueryValidator()
    {
       
           RuleFor(x => x.term).NotEmpty();
    }
}
