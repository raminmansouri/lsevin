using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Customer.Customer.Features.UploadCustomerDocument;

internal sealed record UploadCustomerDocumentCommand(Stream FileStream, string ContentType, int DocumentTypeId)
    : Command<Guid>;
