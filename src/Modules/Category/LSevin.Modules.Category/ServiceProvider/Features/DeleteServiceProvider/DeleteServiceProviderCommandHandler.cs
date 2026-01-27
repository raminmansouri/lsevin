using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.DeleteServiceProvider;

internal sealed class DeleteServiceProviderCommandHandler(IServiceProviderRepository repository)
    : CommandHandler<DeleteServiceProviderCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        DeleteServiceProviderCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdSpec(command.ServiceProviderId);
        var serviceProvider = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        // Domain entity should perform any business rules before deletion
        // through the CheckRule pattern, to ensure domain invariants are maintained
        repository.Delete(serviceProvider);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceProvider.Id.Value;
    }
}
