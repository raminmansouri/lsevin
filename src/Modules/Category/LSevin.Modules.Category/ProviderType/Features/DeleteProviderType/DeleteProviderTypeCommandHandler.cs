using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.Data.Repository;
using LSevin.Modules.Category.ProviderType.Specifications;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.DeleteProviderType;

internal sealed class DeleteProviderTypeCommandHandler(IProviderTypeRepository repository)
    : CommandHandler<DeleteProviderTypeCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        DeleteProviderTypeCommand command,
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

        repository.Delete(providerType);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return providerType.Id.Value;
    }
}
