using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceRequest.Features.ApproveServiceProviderRequest;

internal sealed record ApproveServiceProviderRequestCommand(Guid RequestId) : Command<bool>;
