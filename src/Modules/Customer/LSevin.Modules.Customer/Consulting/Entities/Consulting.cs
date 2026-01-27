using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Customer.Consulting.Rules;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Consulting.Entities;

public sealed class Consulting : AggregateRoot<ConsultingId>
{
    #region Constructors

    private Consulting()
    {
        CustomerId = null!;
        Description = string.Empty;
        CategoryId = IdGenerator.EmptyId;
        CategoryName = string.Empty;
        _documents = [];
    }

    private Consulting(
        CustomerId customerId,
        string description,
        Guid categoryId,
        string categoryName,
        IReadOnlyCollection<ConsultingSelectedDocumentReference> documents
    )
        : this()
    {
        Id = ConsultingId.Create(IdGenerator.NewId());
        CustomerId = customerId;
        Description = description;
        CategoryId = categoryId;
        CategoryName = categoryName;
        _documents = [.. documents];
    }

    #endregion

    #region Properties

    public CustomerId CustomerId { get; private set; }
    public string Description { get; private set; }

    public Guid CategoryId { get; private set; }
    public string CategoryName { get; private set; }

    public IReadOnlyCollection<ConsultingSelectedDocumentReference> Documents => _documents.AsReadOnly();
    private readonly List<ConsultingSelectedDocumentReference> _documents;

    #endregion

    #region Methods

    public static Consulting Create(
        CustomerId customerId,
        string description,
        Guid categoryId,
        string categoryName,
        IReadOnlyCollection<CustomerDocumentId> documents,
        ICustomerDocumentCheckerService customerDocumentCheckerService
    )
    {
        Guard.Against.Null(customerId, nameof(customerId));
        Guard.Against.NullOrEmpty(description, nameof(description));
        Guard.Against.Null(categoryId, nameof(categoryId));
        Guard.Against.NullOrEmpty(categoryName, nameof(categoryName));
        Guard.Against.Null(documents, nameof(documents));

        CheckRule(new ConsultingSelectedDocumentsMustExistRule(customerDocumentCheckerService, customerId, documents));

        var selectedDocuments = documents.Select(ConsultingSelectedDocumentReference.Create).ToList();
        return new Consulting(customerId, description, categoryId, categoryName, selectedDocuments);
    }

    public void RemoveSelectedDocument(CustomerDocumentId documentId)
    {
        Guard.Against.Null(documentId, nameof(documentId));

        var document = _documents.FindIndex(d => d.CustomerDocumentId == documentId);
        _documents.RemoveAt(document);
    }

    #endregion
}
