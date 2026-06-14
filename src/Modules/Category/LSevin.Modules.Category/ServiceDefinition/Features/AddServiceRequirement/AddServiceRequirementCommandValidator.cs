using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceRequirement;

internal sealed class AddServiceRequirementCommandValidator : AbstractValidator<AddServiceRequirementCommand>
{
    public AddServiceRequirementCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                CategoryResource.Service_Requirement_Description
            // maxLength: DomainConstValues.ServiceRequirementDescriptionMaxLength
            );
    }
}
