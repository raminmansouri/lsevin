using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.RemoveProviderAttributeDefinition;

internal sealed class RemoveProviderAttributeDefinitionCommandHandler(IProviderTypeRepository providerTypeRepository)
    : CommandHandler<RemoveProviderAttributeDefinitionCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RemoveProviderAttributeDefinitionCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ProviderTypeByIdAndDetailsSpec(command.ProviderTypeId);
        var providerType = await providerTypeRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (providerType is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);

        providerType.RemoveAttributeDefinition(command.AttributeDefinitionId);

        providerTypeRepository.Update(providerType);
        await providerTypeRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.AttributeDefinitionId;
    }
}
