using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderPolicy;

internal sealed class AddProviderPolicyCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<AddProviderPolicyCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderPolicyCommand command,
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

        // Convert LocalizedContentDto to LocalizedString
        var type = LocalizedString.Create(command.Type.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var policy = ProviderPolicy.Create(type, description);
        serviceProvider.AddPolicy(policy);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return policy.Id.Value;
    }
}
