using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Data.Repository;
using LSevin.Modules.Category.ServiceDefinition.Entities;
using LSevin.Modules.Category.ServiceDefinition.Specifications;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

internal sealed class AddServiceAttributeDefinitionCommandHandler(
    IServiceDefinitionRepository serviceDefinitionRepository
) : CommandHandler<AddServiceAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddServiceAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceDefinitionByIdSpec(command.ServiceDefinitionId);
        var serviceDefinition = await serviceDefinitionRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceDefinition is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);

        var type = Enumeration.FromValue<AttributeType>(command.AttributeType);

        var localizedName = LocalizedString.Create(command.Name.Translations);
        var localizedDescription = LocalizedString.Create(command.Description.Translations);

        var attributeDefinition = ServiceAttributeDefinition.Create(
            localizedName,
            localizedDescription,
            type,
            command.IsRequired,
            false,
            0
        );

        if (command.Options is not null)
        {
            foreach (var option in command.Options)
            {
                var displayNameLocalizedString = LocalizedString.Create(option.DisplayName.Translations);
                var valueLocalizedString = LocalizedString.Create(option.Value.Translations);

                attributeDefinition.AddOption(
                    AttributeOption.Create(displayNameLocalizedString, valueLocalizedString, option.AdditionalPrice)
                );
            }
        }

        serviceDefinition.AddAttributeDefinition(attributeDefinition);

        serviceDefinitionRepository.Update(serviceDefinition);
        await serviceDefinitionRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return attributeDefinition.Id.Value;
    }
}
