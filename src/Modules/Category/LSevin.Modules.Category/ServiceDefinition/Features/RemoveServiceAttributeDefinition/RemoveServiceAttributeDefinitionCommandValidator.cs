using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceAttributeDefinition;

internal sealed class RemoveServiceAttributeDefinitionCommandValidator
    : AbstractValidator<RemoveServiceAttributeDefinitionCommand>
{
    public RemoveServiceAttributeDefinitionCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.AttributeDefinitionId).ValidateGuid(CategoryResource.Service_Attribute_Definition);
    }
}
