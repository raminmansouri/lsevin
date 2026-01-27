using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceRequest.Features.AddServiceProviderRequest;

public sealed record AddServiceProviderRequestCommand(Guid ServiceProviderId, string Message) : Command<Guid>;
