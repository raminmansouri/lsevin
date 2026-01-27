using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.ServiceRequest.Data.Repository;
using RequestDomain = LSevin.Modules.Category.ServiceRequest.Entities.ServiceProviderRequest;

namespace LSevin.Modules.Category.ServiceRequest.Features.AddServiceProviderRequest;

internal sealed class AddServiceProviderRequestCommandHandler(
    IServiceProviderRequestRepository repository,
    IUserAccessor userAccessor
) : CommandHandler<AddServiceProviderRequestCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddServiceProviderRequestCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var request = RequestDomain.Create(
            serviceProviderId: ServiceProviderId.Create(command.ServiceProviderId),
            customerId: userAccessor.GetUserIdentity,
            customerEmail: userAccessor.GetUserEmail,
            customerFullName: userAccessor.GetUserFullName,
            message: command.Message
        );

        await repository.CreateAsync(request, cancellationToken);
        return request.Id.Value;
    }
}
