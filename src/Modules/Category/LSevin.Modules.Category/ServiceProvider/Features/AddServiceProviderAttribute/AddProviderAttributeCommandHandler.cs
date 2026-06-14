using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddServiceProviderAttribute;

internal sealed class AddProviderAttributeCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<AddProviderAttributeCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderAttributeCommand command,
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
        var value = LocalizedString.Create(command.Value.Translations);

        var attribute = ProviderAttribute.Create(command.AttributeDefinitionId, value);
        serviceProvider.AddAttribute(attribute);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return attribute.Id.Value;
    }
}
