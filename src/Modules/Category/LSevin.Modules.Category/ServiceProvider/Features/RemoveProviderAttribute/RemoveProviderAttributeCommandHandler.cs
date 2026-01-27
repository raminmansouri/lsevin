using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderAttribute;

internal sealed class RemoveProviderAttributeCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<RemoveProviderAttributeCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RemoveProviderAttributeCommand command,
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

        var attribute = serviceProvider.Attributes.FirstOrDefault(a =>
            a.AttributeDefinitionId.Value == command.AttributeId
        );
        if (attribute is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Attribute_Definition);
        }

        serviceProvider.RemoveAttribute(attribute.Id);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
