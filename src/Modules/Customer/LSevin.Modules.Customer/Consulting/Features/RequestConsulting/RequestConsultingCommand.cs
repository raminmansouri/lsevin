using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Customer.Consulting.Features.RequestConsulting;

internal sealed record RequestConsultingCommand(
    string Description,
    Guid CategoryId,
    string CategoryName,
    IReadOnlyCollection<Guid> DocumentIds
) : Command<Guid>;
