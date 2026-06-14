using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Customer.Customer.Enumerations;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Entities;

public sealed class CustomerDocument : Entity<CustomerDocumentId>
{
    #region Constructors

    private CustomerDocument()
    {
        _documentTypeId = -1;
        DocumentUrl = string.Empty;
    }

    private CustomerDocument(CustomerDocumentType documentType, string documentUrl)
        : this()
    {
        Id = CustomerDocumentId.Create(IdGenerator.NewId());
        _documentTypeId = documentType;
        DocumentUrl = documentUrl;
    }

    #endregion

    #region Properties

    public CustomerDocumentType? DocumentType { get; private set; }
    private readonly int _documentTypeId;

    public string DocumentUrl { get; private set; }

    #endregion

    #region Methods

    public static CustomerDocument Create(CustomerDocumentType documentType, string documentUrl)
    {
        Guard.Against.Null(documentType, nameof(documentType));
        Guard.Against.NullOrEmpty(documentUrl, nameof(documentUrl));

        return new CustomerDocument(documentType, documentUrl);
    }

    public int GetDocumentTypeId() => _documentTypeId;

    #endregion
}
