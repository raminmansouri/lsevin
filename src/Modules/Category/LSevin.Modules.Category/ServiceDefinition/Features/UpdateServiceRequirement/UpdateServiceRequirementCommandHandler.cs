using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceRequirement;

internal sealed class UpdateServiceRequirementCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<UpdateServiceRequirementCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateServiceRequirementCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdAndDetailsSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        var localizedDescription = LocalizedString.Create(command.Description.Translations);
        serviceDefinition.UpdateRequirement(command.RequirementIndex, localizedDescription, command.IsMandatory);

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.ServiceDefinitionId;
    }
}
