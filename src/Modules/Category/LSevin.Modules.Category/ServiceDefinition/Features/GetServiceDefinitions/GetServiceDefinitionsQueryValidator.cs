using BuildingBlocks.Validation.Common;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

internal sealed class GetServiceDefinitionsQueryValidator : AbstractValidator<GetServiceDefinitionsQuery>
{
    public GetServiceDefinitionsQueryValidator()
    {
        When(
            x => x.CategoryId.HasValue,
            () => RuleFor(x => x.CategoryId!.Value).ValidateGuid(CategoryResource.Category)
        );
        Include(new PageRequestValidator());
    }
}
