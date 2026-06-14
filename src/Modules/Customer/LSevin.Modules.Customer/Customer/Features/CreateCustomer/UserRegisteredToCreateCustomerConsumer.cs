using AutoMapper;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using LSevin.Modules.Common.IntegrationEvents.User;

namespace LSevin.Modules.Customer.Customer.Features.CreateCustomer;

internal sealed class UserRegisteredToCreateCustomerConsumer(ICommandBus commandBus, IMapper mapper)
    : IntegrationEventHandler<UserRegisteredIntegrationEvent>
{
    public override Task Handle(
        UserRegisteredIntegrationEvent notification,
        CancellationToken cancellationToken = default
    )
    {
        var command = mapper.Map<CreateCustomerCommand>(notification);
        return commandBus.ScheduleAsync(command, cancellationToken);
    }
}
