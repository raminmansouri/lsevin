using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceRequirement;

internal sealed class AddServiceRequirementCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<AddServiceRequirementCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddServiceRequirementCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        var localizedDescription = LocalizedString.Create(command.Description.Translations);
        var requirement = ServiceRequirement.Create(localizedDescription, command.IsMandatory);

        serviceDefinition.AddRequirement(requirement);

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.ServiceDefinitionId;
    }
}
