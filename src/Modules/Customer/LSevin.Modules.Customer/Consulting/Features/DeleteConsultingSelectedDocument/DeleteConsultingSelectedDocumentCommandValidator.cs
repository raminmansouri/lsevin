using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Customer.Consulting.Features.DeleteConsultingSelectedDocument;

internal sealed class DeleteConsultingSelectedDocumentCommandValidator
    : AbstractValidator<DeleteConsultingSelectedDocumentCommand>
{
    public DeleteConsultingSelectedDocumentCommandValidator()
    {
        RuleFor(command => command.CustomerDocumentId).ValidateGuid(SharedResource.Document);
    }
}
