using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Customer.Customer.Features.DeleteCustomerDocument;

internal sealed class DeleteCustomerDocumentValidator : AbstractValidator<DeleteCustomerDocumentCommand>
{
    public DeleteCustomerDocumentValidator()
    {
        RuleFor(r => r.DocumentId).ValidateGuid(SharedResource.Document);
    }
}
