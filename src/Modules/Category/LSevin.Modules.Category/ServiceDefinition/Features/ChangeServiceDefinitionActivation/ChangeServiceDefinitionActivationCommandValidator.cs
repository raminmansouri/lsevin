using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.ChangeServiceDefinitionActivation;

internal sealed class ChangeServiceDefinitionActivationCommandValidator
    : AbstractValidator<ChangeServiceDefinitionActivationCommand>
{
    public ChangeServiceDefinitionActivationCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);
    }
}
