using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderService;

internal sealed class AddProviderServiceCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<AddProviderServiceCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderServiceCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        // Convert LocalizedContentDto to LocalizedString
        var displayName = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var moneyValue =
            command.Price > 0 ? MoneyValue.Of(command.Price, command.Currency) : MoneyValue.Zero(command.Currency);
        var service = ProviderService.Create(
            command.ServiceDefinitionId,
            displayName,
            description,
            moneyValue,
            command.DurationMinutes,
            command.IsActive
        );
        serviceProvider.AddService(service);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return service.Id.Value;
    }
}
