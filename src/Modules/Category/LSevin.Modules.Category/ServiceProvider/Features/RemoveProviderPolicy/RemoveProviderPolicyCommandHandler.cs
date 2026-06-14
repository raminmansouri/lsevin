using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderPolicy;

internal sealed class RemoveProviderPolicyCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<RemoveProviderPolicyCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RemoveProviderPolicyCommand command,
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
        var policy = serviceProvider.Policies.FirstOrDefault(p => p.Id == policyId);

        if (policy is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider_Policy);
        }

        // Remove the policy using the domain entity method
        serviceProvider.RemovePolicy(policyId);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
