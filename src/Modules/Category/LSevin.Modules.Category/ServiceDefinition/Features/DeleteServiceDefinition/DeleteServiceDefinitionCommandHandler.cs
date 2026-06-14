using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;

namespace LSevin.Modules.Category.ServiceDefinition.Features.DeleteServiceDefinition;

internal sealed class DeleteServiceDefinitionCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<DeleteServiceDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        DeleteServiceDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        serviceDefinitionRepository.Delete(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceDefinition.Id.Value;
    }
}
