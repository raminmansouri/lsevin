using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomer;

internal sealed record UpdateCustomerCommand(DateTime BirthDate, AddressDto Address, int Gender) : Command<Guid>;
