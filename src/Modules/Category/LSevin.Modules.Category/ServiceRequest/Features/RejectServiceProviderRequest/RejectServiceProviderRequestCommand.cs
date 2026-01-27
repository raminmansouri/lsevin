using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceRequest.Features.RejectServiceProviderRequest;

internal sealed record RejectServiceProviderRequestCommand(Guid RequestId) : Command<bool>;
