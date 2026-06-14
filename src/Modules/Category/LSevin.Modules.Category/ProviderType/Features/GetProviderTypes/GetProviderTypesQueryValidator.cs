using BuildingBlocks.Validation.Common;
using FluentValidation;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypes;

internal sealed class GetProviderTypesQueryValidator : AbstractValidator<GetProviderTypesQuery>
{
    public GetProviderTypesQueryValidator()
    {
        Include(new PageRequestValidator());
    }
}
