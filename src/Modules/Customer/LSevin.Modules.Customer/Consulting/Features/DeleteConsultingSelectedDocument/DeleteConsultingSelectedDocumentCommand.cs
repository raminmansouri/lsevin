using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Customer.Consulting.Features.DeleteConsultingSelectedDocument;

public sealed record DeleteConsultingSelectedDocumentCommand(Guid CustomerDocumentId) : InternalCommand;
