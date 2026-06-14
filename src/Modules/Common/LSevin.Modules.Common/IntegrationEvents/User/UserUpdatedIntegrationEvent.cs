using BuildingBlocks.Core.Messaging.EventBus;

namespace LSevin.Modules.Common.IntegrationEvents.User;

public sealed record UserUpdatedIntegrationEvent(
    Guid UserId,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string FirstName,
    string LastName
) : IntegrationEvent;
