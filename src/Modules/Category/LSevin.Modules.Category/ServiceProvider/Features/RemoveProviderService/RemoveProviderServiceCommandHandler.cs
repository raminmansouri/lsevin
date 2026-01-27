using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderService;

internal sealed class RemoveProviderServiceCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<RemoveProviderServiceCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RemoveProviderServiceCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        var service = serviceProvider.Services.FirstOrDefault(s => s.ServiceDefinitionId.Value == command.ServiceId);
        if (service is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider_Services);
        }

        serviceProvider.RemoveService(service.Id);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
