using System.Text.Json.Serialization;
using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Customer.Customer.Enumerations;

public sealed class CustomerDocumentType : Enumeration
{
    public static readonly CustomerDocumentType Passport = new(1, nameof(Passport));
    public static readonly CustomerDocumentType Visa = new(2, nameof(Visa));
    public static readonly CustomerDocumentType DriverLicense = new(3, nameof(DriverLicense));
    public static readonly CustomerDocumentType BankStatement = new(4, nameof(BankStatement));
    public static readonly CustomerDocumentType IdCard = new(5, nameof(IdCard));
    public static readonly CustomerDocumentType Medical = new(6, nameof(Medical));
    public static readonly CustomerDocumentType Beauty = new(7, nameof(Beauty));
    public static readonly CustomerDocumentType Tourism = new(8, nameof(Tourism));
    public static readonly CustomerDocumentType Other = new(9, nameof(Other));

    [JsonConstructor]
    private CustomerDocumentType(int id, string name)
        : base(id, name) { }
}
