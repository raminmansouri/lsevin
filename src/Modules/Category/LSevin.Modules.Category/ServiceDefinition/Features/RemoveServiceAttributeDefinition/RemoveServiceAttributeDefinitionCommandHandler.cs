using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceAttributeDefinition;

internal sealed class RemoveServiceAttributeDefinitionCommandHandler(
    IServiceDefinitionRepository serviceDefinitionRepository
) : CommandHandler<RemoveServiceAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RemoveServiceAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdAndDetailsSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        serviceDefinition.RemoveAttributeDefinition(command.AttributeDefinitionId);

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.AttributeDefinitionId;
    }
}
