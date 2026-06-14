using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceRequirement;

internal sealed class RemoveServiceRequirementCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<RemoveServiceRequirementCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RemoveServiceRequirementCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdAndDetailsSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        serviceDefinition.RemoveRequirement(command.RequirementIndex);

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.ServiceDefinitionId;
    }
}
