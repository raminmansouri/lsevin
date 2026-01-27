using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Specifications;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceAttributeDefinition;

internal sealed class UpdateServiceAttributeDefinitionCommandHandler(
    IServiceDefinitionRepository serviceDefinitionRepository
) : CommandHandler<UpdateServiceAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateServiceAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdAndDetailsSpec(ServiceDefinitionId.Create(command.ServiceDefinitionId));
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        var type = Enumeration.FromValue<AttributeType>(command.AttributeType);
        var localizedName = LocalizedString.Create(command.Name.Translations);
        var localizedDescription = LocalizedString.Create(command.Description.Translations);

        var attributeDefinitionId = ServiceAttributeDefinitionId.Create(command.AttributeDefinitionId);

        // Update the attribute definition
        serviceDefinition.UpdateAttributeDefinition(
            attributeDefinitionId,
            localizedName,
            localizedDescription,
            type,
            command.IsRequired,
            command.AffectsPricing,
            command.DisplayOrder
        );

        // Handle options update if provided
        if (command.Options is not null)
        {
            var attribute = serviceDefinition.AttributeDefinitions.FirstOrDefault(a => a.Id == attributeDefinitionId);

            if (attribute is not null)
            {
                // Clear existing options and add new ones
                attribute.ClearOptions();

                foreach (var option in command.Options)
                {
                    var displayNameLocalizedString = LocalizedString.Create(option.DisplayName.Translations);
                    var valueLocalizedString = LocalizedString.Create(option.Value.Translations);

                    attribute.AddOption(
                        AttributeOption.Create(displayNameLocalizedString, valueLocalizedString, option.AdditionalPrice)
                    );
                }
            }
        }

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.AttributeDefinitionId;
    }
}
