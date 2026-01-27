using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.DeleteServiceDefinition;

internal sealed class DeleteServiceDefinitionCommandValidator : AbstractValidator<DeleteServiceDefinitionCommand>
{
    public DeleteServiceDefinitionCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);
    }
}
