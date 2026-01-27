using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderService;

internal sealed class UpdateProviderServiceCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<UpdateProviderServiceCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        UpdateProviderServiceCommand command,
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

        // Convert LocalizedContentDto to LocalizedString
        var displayName = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var moneyValue =
            command.Price > 0 ? MoneyValue.Of(command.Price, command.Currency) : MoneyValue.Zero(command.Currency);

        serviceProvider.UpdateService(service.Id, displayName, description, moneyValue, command.DurationMinutes, true);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
