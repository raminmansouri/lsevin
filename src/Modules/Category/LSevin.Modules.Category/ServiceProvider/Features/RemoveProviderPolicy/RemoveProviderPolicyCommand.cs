using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderPolicy;

public sealed record RemoveProviderPolicyCommand(Guid ServiceProviderId, Guid PolicyId) : Command<bool>;
