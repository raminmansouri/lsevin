using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceRequirement;

internal sealed class RemoveServiceRequirementCommandValidator : AbstractValidator<RemoveServiceRequirementCommand>
{
    public RemoveServiceRequirementCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.RequirementIndex).InclusiveBetween(0, int.MaxValue);
    }
}
