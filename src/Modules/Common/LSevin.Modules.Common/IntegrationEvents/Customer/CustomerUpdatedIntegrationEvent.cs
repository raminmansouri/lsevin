using BuildingBlocks.Core.Messaging.EventBus;

namespace LSevin.Modules.Common.IntegrationEvents.Customer;

public sealed record CustomerUpdatedIntegrationEvent(
    Guid CustomerId,
    string FirstName,
    string LastName,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string Email
) : IntegrationEvent;
