using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderAttributeDefinition;

internal sealed class UpdateProviderAttributeDefinitionCommandHandler(IProviderTypeRepository providerTypeRepository)
    : CommandHandler<UpdateProviderAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateProviderAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ProviderTypeByIdAndDetailsSpec(ProviderTypeId.Create(command.ProviderTypeId));
        var providerType = await providerTypeRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (providerType is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);

        var type = Enumeration.FromValue<AttributeType>(command.AttributeTypeId);
        var localizedName = LocalizedString.Create(command.Name.Translations);
        var localizedDescription = LocalizedString.Create(command.Description.Translations);

        var attributeDefinitionId = ProviderAttributeDefinitionId.Create(command.AttributeDefinitionId);

        // Update the attribute definition
        providerType.UpdateAttributeDefinition(
            attributeDefinitionId,
            localizedName,
            localizedDescription,
            type,
            command.IsRequired,
            command.ValidationRules ?? string.Empty
        );

        // Handle options if provided
        if (command.Options is not null)
        {
            var attributeDefinition = providerType.AttributeDefinitions.FirstOrDefault(ad =>
                ad.Id == attributeDefinitionId
            );
            if (attributeDefinition is not null)
            {
                // Clear existing options
                attributeDefinition.ClearOptions();

                // Add new options
                foreach (var option in command.Options)
                {
                    var displayNameLocalizedString = LocalizedString.Create(option.DisplayName.Translations);
                    var valueLocalizedString = LocalizedString.Create(option.Value.Translations);
                    attributeDefinition.AddOption(
                        AttributeOption.Create(displayNameLocalizedString, valueLocalizedString)
                    );
                }
            }
        }

        providerTypeRepository.Update(providerType);
        await providerTypeRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.AttributeDefinitionId;
    }
}
