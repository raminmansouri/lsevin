using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Events.DomainEvents;

public sealed record CustomerUpdatedDomainEvent(
    CustomerId CustomerId,
    FirstName FirstName,
    LastName LastName,
    PhoneNumber PhoneNumber,
    Email Email
) : DomainEvent;
