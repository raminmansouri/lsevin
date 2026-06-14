using BuildingBlocks.Core.Messaging.EventBus;

namespace LSevin.Modules.Common.IntegrationEvents.User;

public sealed record UserRegisteredIntegrationEvent(
    Guid UserId,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string UserName,
    string FirstName,
    string LastName,
    IEnumerable<string>? Roles
) : IntegrationEvent;
