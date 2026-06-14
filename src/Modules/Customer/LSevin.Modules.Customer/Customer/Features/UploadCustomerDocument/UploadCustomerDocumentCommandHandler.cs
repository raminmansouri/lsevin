using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Entities;
using LSevin.Modules.Customer.Customer.Enumerations;
using LSevin.Modules.Customer.Customer.Specifications;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.UploadCustomerDocument;

internal sealed class UploadCustomerDocumentCommandHandler(
    ICustomerRepository customerRepository,
    IUserAccessor userAccessor,
    IFileService fileService
) : CommandHandler<UploadCustomerDocumentCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UploadCustomerDocumentCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new CustomerByIdSpec(userAccessor.GetUserIdentity);
        var customer = await customerRepository.FirstOrDefaultAsync(spec, cancellationToken);
        if (customer is null)
            return AppError.NotFoundErrorMessage(CustomerResource.Customer);

        var file = await fileService.UploadFileAsync(
            command.FileStream,
            directory: nameof(CustomerDocument),
            contentType: command.ContentType,
            cancellationToken
        );

        if (file.IsFailure || file.Value is { FilePaths.Count: 0 } or { TotalFileUploaded: 0 })
        {
            return AppError.ApplicationErrorMessage(SharedResource.File_Upload_Error_Message);
        }

        foreach (var filePath in file.Value!.FilePaths!)
        {
            customer.AddDocument(Enumeration.FromValue<CustomerDocumentType>(command.DocumentTypeId), filePath);
        }

        customerRepository.Update(customer);
        await customerRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return customer.Documents.Last().Id.Value;
    }
}
