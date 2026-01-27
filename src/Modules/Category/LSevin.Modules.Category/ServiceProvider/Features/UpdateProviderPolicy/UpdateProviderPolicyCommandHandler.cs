using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderPolicy;

internal sealed class UpdateProviderPolicyCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<UpdateProviderPolicyCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateProviderPolicyCommand command,
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

        var policyId = ProviderPolicyId.Create(command.PolicyId);

        // Convert LocalizedContentDto to LocalizedString
        var type = LocalizedString.Create(command.Type.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        // Update the policy using the aggregate method
        serviceProvider.UpdatePolicy(policyId, type, description);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return command.PolicyId;
    }
}
