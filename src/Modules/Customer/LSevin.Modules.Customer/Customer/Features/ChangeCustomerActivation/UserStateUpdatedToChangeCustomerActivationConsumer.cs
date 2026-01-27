using AutoMapper;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using LSevin.Modules.Common.IntegrationEvents.User;

namespace LSevin.Modules.Customer.Customer.Features.ChangeCustomerActivation;

internal sealed class UserStateUpdatedToChangeCustomerActivationConsumer(ICommandBus commandBus, IMapper mapper)
    : IntegrationEventHandler<UserStateUpdatedIntegrationEvent>
{
    public override Task Handle(
        UserStateUpdatedIntegrationEvent notification,
        CancellationToken cancellationToken = default
    )
    {
        var command = mapper.Map<ChangeCustomerActivationCommand>(notification);
        return commandBus.ScheduleAsync(command, cancellationToken);
    }
}
