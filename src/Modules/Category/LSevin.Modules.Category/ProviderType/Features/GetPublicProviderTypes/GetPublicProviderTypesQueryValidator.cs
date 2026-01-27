using FluentValidation;

namespace LSevin.Modules.Category.ProviderType.Features.GetPublicProviderTypes;

internal sealed class GetPublicProviderTypesQueryValidator : AbstractValidator<GetPublicProviderTypesQuery>
{
    public GetPublicProviderTypesQueryValidator()
    {
        // No validation needed for this query
    }
}
