using AutoMapper;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using LSevin.Modules.Common.IntegrationEvents.User;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomerUserIdentityBaseInfo;

internal sealed class UserUpdatedToUpdateCustomerConsumer(ICommandBus commandBus, IMapper mapper)
    : IntegrationEventHandler<UserUpdatedIntegrationEvent>
{
    public override Task Handle(UserUpdatedIntegrationEvent notification, CancellationToken cancellationToken = default)
    {
        var command = mapper.Map<UpdateCustomerUserIdentityBaseInfoCommand>(notification);
        return commandBus.ScheduleAsync(command, cancellationToken);
    }
}
