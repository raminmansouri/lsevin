using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Customer.Customer.Features.ChangeCustomerActivation;

internal sealed record ChangeCustomerActivationCommand(Guid UserId, bool IsActive) : InternalCommand;
