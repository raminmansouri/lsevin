using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Enumerations;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using LSevin.Modules.Customer.Customer.Enumerations;
using LSevin.Modules.Customer.Customer.Events.DomainEvents;
using LSevin.Modules.Customer.Customer.Rule;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Entities;

public sealed class Customer : AggregateRoot<CustomerId>
{
    #region Constructors

    private Customer()
    {
        FirstName = null!;
        LastName = null!;
        PhoneNumber = null!;
        Email = null!;
        BirthDate = null;
        Address = null;
        Gender = null;
        IsActive = true;
        _documents = [];
    }

    private Customer(
        Guid identityId,
        FirstName firstName,
        LastName lastName,
        PhoneNumber phoneNumber,
        Email email,
        BirthDate? birthDate,
        Address? address,
        Gender? gender,
        IReadOnlyCollection<CustomerDocument> documents
    )
        : this()
    {
        Id = CustomerId.Create(identityId);
        FirstName = firstName;
        LastName = lastName;
        PhoneNumber = phoneNumber;
        Email = email;
        BirthDate = birthDate;
        Address = address;
        Gender = gender;
        _documents = [.. documents];
    }

    #endregion

    #region Properties

    public FirstName FirstName { get; private set; }
    public LastName LastName { get; private set; }
    public PhoneNumber PhoneNumber { get; private set; }
    public Email Email { get; private set; }
    public BirthDate? BirthDate { get; private set; }
    public Address? Address { get; private set; }
    public Gender? Gender { get; private set; }
    public bool IsActive { get; private set; }

    public IReadOnlyCollection<CustomerDocument> Documents => _documents.AsReadOnly();
    private readonly List<CustomerDocument> _documents;

    #endregion

    #region Methods

    public static Customer Create(
        Guid identityId,
        FirstName firstName,
        LastName lastName,
        PhoneNumber phoneNumber,
        Email email,
        ICustomerUniquenessCheckerService customerUniquenessCheckerService
    )
    {
        Guard.Against.NullOrEmpty(identityId, nameof(identityId));
        Guard.Against.Null(firstName, nameof(firstName));
        Guard.Against.Null(lastName, nameof(lastName));
        Guard.Against.Null(phoneNumber, nameof(phoneNumber));

        CheckRule(new CustomerEmailMustBeUniqueRule(customerUniquenessCheckerService, email));

        CheckRule(new CustomerPhoneNumberMustBeUniqueRule(customerUniquenessCheckerService, phoneNumber));

        var customer = new Customer(
            identityId,
            firstName,
            lastName,
            phoneNumber,
            email,
            birthDate: null,
            address: null,
            gender: null,
            documents: []
        );

        customer.AddDomainEvent(new CustomerCreatedDomainEvent(customer.Id, firstName, lastName, phoneNumber, email));

        return customer;
    }

    public void UpdateUserIdentity(
        FirstName firstName,
        LastName lastName,
        PhoneNumber phoneNumber,
        Email email,
        ICustomerUniquenessCheckerService customerUniquenessCheckerService
    )
    {
        Guard.Against.Null(firstName, nameof(firstName));
        Guard.Against.Null(lastName, nameof(lastName));
        Guard.Against.Null(phoneNumber, nameof(phoneNumber));
        Guard.Against.Null(email, nameof(email));

        CheckRule(new CustomerEmailMustBeUniqueRule(customerUniquenessCheckerService, email, Id));

        CheckRule(new CustomerPhoneNumberMustBeUniqueRule(customerUniquenessCheckerService, phoneNumber, Id));

        FirstName = firstName;
        LastName = lastName;
        PhoneNumber = phoneNumber;
        Email = email;

        AddDomainEvent(new CustomerUpdatedDomainEvent(Id, firstName, lastName, phoneNumber, email));
    }

    public void ChangeAttribute(BirthDate birthDate, Address address, Gender gender)
    {
        Guard.Against.Null(birthDate, nameof(birthDate));
        Guard.Against.Null(address, nameof(address));
        Guard.Against.Null(gender, nameof(gender));

        BirthDate = birthDate;
        Address = address;
        Gender = gender;
    }

    public void AddDocument(CustomerDocumentType documentType, string documentUrl)
    {
        _documents.Add(CustomerDocument.Create(documentType, documentUrl));
    }

    public void RemoveDocument(CustomerDocumentId documentId)
    {
        Guard.Against.Null(documentId, nameof(documentId));

        var document = _documents.FindIndex(d => d.Id == documentId);
        _documents.RemoveAt(document);

        AddDomainEvent(new CustomerDocumentDeletedDomainEvent(documentId));
    }

    public void ChangeActivation(bool isActive)
    {
        IsActive = isActive;
    }

    #endregion
}
