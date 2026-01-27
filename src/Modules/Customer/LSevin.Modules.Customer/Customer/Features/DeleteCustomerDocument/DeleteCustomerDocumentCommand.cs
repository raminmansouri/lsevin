using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Customer.Customer.Features.DeleteCustomerDocument;

internal sealed record DeleteCustomerDocumentCommand(Guid DocumentId) : Command<Guid>;
