using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Features.CreateServiceDefinition;

internal sealed class CreateServiceDefinitionCommandHandler(IServiceDefinitionRepository serviceDefinitionRepository)
    : CommandHandler<CreateServiceDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        CreateServiceDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);
        var basePrice =
            command.Value > 0 ? MoneyValue.Of(command.Value, command.Currency) : MoneyValue.Zero(command.Currency);

        var serviceDefinition = ServiceDefinitionDomain.Create(
            name,
            description,
            command.CategoryId,
            command.DurationMinutes,
            basePrice,
            command.PricingModel,
            command.IsActive
        );

        await serviceDefinitionRepository.CreateAsync(serviceDefinition, cancellationToken);

        return serviceDefinition.Id.Value;
    }
}
