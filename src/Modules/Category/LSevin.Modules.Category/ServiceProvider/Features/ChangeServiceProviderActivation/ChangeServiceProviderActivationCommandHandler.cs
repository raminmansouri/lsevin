using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using ServiceProviderDomain = LSevin.Modules.Category.ServiceProvider.Entities.ServiceProvider;

namespace LSevin.Modules.Category.ServiceProvider.Features.ChangeServiceProviderActivation;

internal sealed class ChangeServiceProviderActivationCommandHandler(IServiceProviderRepository repository)
    : CommandHandler<ChangeServiceProviderActivationCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        ChangeServiceProviderActivationCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdSpec(command.ServiceProviderId);
        var serviceProvider = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        serviceProvider.ChangeActivation(command.IsActive);

        repository.Update(serviceProvider);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceProvider.Id.Value;
    }
}
