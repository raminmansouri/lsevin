using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Entities;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Features.AddProviderAttributeDefinition;

internal sealed class AddProviderAttributeDefinitionCommandHandler(IProviderTypeRepository providerTypeRepository)
    : CommandHandler<AddProviderAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ProviderTypeByIdSpec(command.ProviderTypeId);
        var providerType = await providerTypeRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (providerType is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);

        var type = Enumeration.FromValue<AttributeType>(command.AttributeTypeId);

        var localizedName = LocalizedString.Create(command.Name.Translations);
        var localizedDescription = LocalizedString.Create(command.Description.Translations);

        var attributeDefinition = ProviderAttributeDefinition.Create(
            localizedName,
            localizedDescription,
            type,
            command.IsRequired,
            command.ValidationRules ?? string.Empty
        );

        if (command.Options is not null)
        {
            foreach (var option in command.Options)
            {
                var displayNameLocalizedString = LocalizedString.Create(option.DisplayName.Translations);
                var valueLocalizedString = LocalizedString.Create(option.Value.Translations);

                attributeDefinition.AddOption(AttributeOption.Create(displayNameLocalizedString, valueLocalizedString));
            }
        }

        providerType.AddAttributeDefinition(attributeDefinition);

        providerTypeRepository.Update(providerType);
        await providerTypeRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return attributeDefinition.Id.Value;
    }
}
