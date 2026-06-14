using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionDetails;

internal sealed class GetServiceDefinitionDetailsQueryValidator : AbstractValidator<GetServiceDefinitionDetailsQuery>
{
    public GetServiceDefinitionDetailsQueryValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);
    }
}
