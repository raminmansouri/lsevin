using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Consulting.Data.Repository;
using LSevin.Modules.Customer.Consulting.Specifications;

namespace LSevin.Modules.Customer.Consulting.Features.DeleteConsultingSelectedDocument;

internal sealed class DeleteConsultingSelectedDocumentCommandHandler(IConsultingRepository repository)
    : InternalCommandHandler<DeleteConsultingSelectedDocumentCommand>
{
    public override async Task<Result<bool>> Handle(
        DeleteConsultingSelectedDocumentCommand command,
        CancellationToken cancellationToken
    )
    {
        var spec = new ConsultingSelectedDocumentByDocumentIdSpec(command.CustomerDocumentId);
        var consultings = await repository.FetchMultiAsync(spec, cancellationToken);
        foreach (var consulting in consultings)
        {
            consulting.RemoveSelectedDocument(command.CustomerDocumentId);
            repository.Update(consulting);
        }

        return await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
