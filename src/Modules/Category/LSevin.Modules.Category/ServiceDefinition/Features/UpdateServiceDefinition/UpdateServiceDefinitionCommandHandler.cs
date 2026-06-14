using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceDefinition;

internal sealed class UpdateServiceDefinitionCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<UpdateServiceDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateServiceDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);
        var basePrice =
            command.Value > 0 ? MoneyValue.Of(command.Value, command.Currency) : MoneyValue.Zero(command.Currency);

        serviceDefinition.Update(
            name,
            description,
            command.CategoryId,
            command.DurationMinutes,
            basePrice,
            command.PricingModel,
            command.IsActive
        );

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceDefinition.Id.Value;
    }
}
