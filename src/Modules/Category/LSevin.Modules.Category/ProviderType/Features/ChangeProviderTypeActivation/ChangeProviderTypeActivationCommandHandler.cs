using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.ChangeProviderTypeActivation;

internal sealed class ChangeProviderTypeActivationCommandHandler(IProviderTypeRepository repository)
    : CommandHandler<ChangeProviderTypeActivationCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        ChangeProviderTypeActivationCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ProviderTypeByIdSpec(command.ProviderTypeId);
        var providerType = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (providerType is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);
        }

        providerType.ChangeActivation(command.IsActive);

        repository.Update(providerType);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return providerType.Id.Value;
    }
}
