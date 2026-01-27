using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Customer.Customer.Enumerations;

namespace LSevin.Modules.Customer.Customer.Features.UploadCustomerDocument;

internal sealed class UploadCustomerDocumentValidator : AbstractValidator<UploadCustomerDocumentCommand>
{
    public UploadCustomerDocumentValidator()
    {
        RuleFor(r => r.FileStream).NotNull();

        RuleFor(r => r.ContentType).ValidateText(SharedResource.Document);

        RuleFor(r => r.DocumentTypeId)
            .MustBeValidEnumeration<UploadCustomerDocumentCommand, CustomerDocumentType>(SharedResource.Document);
    }
}
