using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderType;

internal sealed class UpdateProviderTypeCommandHandler(IProviderTypeRepository repository)
    : CommandHandler<UpdateProviderTypeCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateProviderTypeCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ProviderTypeByIdSpec(ProviderTypeId.Create(command.ProviderTypeId));
        var providerType = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (providerType is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);
        }

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        providerType.Update(name, description, command.IsActive, command.IconUrl);

        repository.Update(providerType);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return providerType.Id.Value;
    }
}
