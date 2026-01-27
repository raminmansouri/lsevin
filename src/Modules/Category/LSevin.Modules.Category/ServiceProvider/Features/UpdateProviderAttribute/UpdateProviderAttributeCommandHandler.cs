using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderAttribute;

internal sealed class UpdateProviderAttributeCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<UpdateProviderAttributeCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateProviderAttributeCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var serviceProviderSpec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(
            serviceProviderSpec,
            cancellationToken
        );

        if (serviceProvider is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        var attribute = serviceProvider.Attributes.FirstOrDefault(a =>
            a.AttributeDefinitionId.Value == command.AttributeDefinitionId
        );
        if (attribute is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Attribute_Definition);
        }

        // Convert LocalizedContentDto to LocalizedString
        var value = LocalizedString.Create(command.Value.Translations);

        serviceProvider.UpdateAttribute(attribute.Id, value);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return attribute.Id.Value;
    }
}
