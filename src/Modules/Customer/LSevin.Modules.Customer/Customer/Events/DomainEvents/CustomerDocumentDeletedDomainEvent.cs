using BuildingBlocks.Core.Messaging.Events;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Events.DomainEvents;

public sealed record CustomerDocumentDeletedDomainEvent(CustomerDocumentId CustomerDocumentId) : DomainEvent;
