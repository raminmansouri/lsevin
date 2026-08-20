using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Specifications;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.DeleteCustomerDocument;

internal sealed class DeleteCustomerDocumentCommandHandler(
    ICustomerRepository customerRepository,
    IUserAccessor userAccessor,
    IFileService fileService
) : CommandHandler<DeleteCustomerDocumentCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        DeleteCustomerDocumentCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        CustomerDocumentId documentId = command.DocumentId;

        var spec = new CustomerDocumentByIdSpec(
            customerId: userAccessor.GetUserIdentity,
            documentId: documentId,
            isReadOnly: false
        );
        var customer = await customerRepository.FirstOrDefaultAsync(spec, cancellationToken);
        if (customer is null || customer.Documents.Count == 0)
            return AppError.NotFoundErrorMessage(SharedResource.Document);

        var document = customer.Documents.First();
        var deleteResult = await fileService.DeleteFileAsync(document.DocumentUrl, cancellationToken);
        if (deleteResult.IsFailure)
            return deleteResult.Errors!.FirstOrDefault()!;

        customer.RemoveDocument(documentId);

        customerRepository.Update(customer);
        await customerRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return documentId.Value;
    }
}
