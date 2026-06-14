using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Features.CreateProviderType;

internal sealed class CreateProviderTypeCommandHandler(IProviderTypeRepository repository)
    : CommandHandler<CreateProviderTypeCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        CreateProviderTypeCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var providerType = ProviderTypeDomain.Create(name, description, command.IsActive, command.IconUrl);

        await repository.CreateAsync(providerType, cancellationToken);

        return providerType.Id.Value;
    }
}
