using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using Humanizer;
using LSevin.Modules.Customer.Customer.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Customer.Consulting.ValueObjects;

public sealed class ConsultingSelectedDocumentReference : ValueObject
{
    public CustomerDocumentId CustomerDocumentId { get; }

    private ConsultingSelectedDocumentReference()
    {
        CustomerDocumentId = null!;
    }

    [JsonConstructor]
    private ConsultingSelectedDocumentReference(CustomerDocumentId customerDocumentId)
    {
        CustomerDocumentId = customerDocumentId;
    }

    public static implicit operator CustomerDocumentId(
        ConsultingSelectedDocumentReference consultingSelectedDocumentReference
    ) => consultingSelectedDocumentReference.CustomerDocumentId;

    public static implicit operator ConsultingSelectedDocumentReference(CustomerDocumentId customerDocumentId) =>
        new(customerDocumentId);

    public static ConsultingSelectedDocumentReference Create(CustomerDocumentId customerDocumentId)
    {
        Guard.Against.Null(customerDocumentId, nameof(customerDocumentId));

        return new ConsultingSelectedDocumentReference(customerDocumentId);
    }

    public void Deconstruct(out CustomerDocumentId customerDocumentId) => customerDocumentId = CustomerDocumentId;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return CustomerDocumentId;
    }

    public override string ToString() => CustomerDocumentId.ToString();
}

public static partial class EntityConfiguration
{
    public static void Configure(this ComplexPropertyBuilder<ConsultingSelectedDocumentReference> builder)
    {
        builder
            .Property(b => b.CustomerDocumentId)
            .HasColumnName(nameof(ConsultingSelectedDocumentReference.CustomerDocumentId).Underscore())
            .IsRequired();
    }

    public static void Configure<T>(this OwnedNavigationBuilder<T, ConsultingSelectedDocumentReference> builder)
        where T : class
    {
        builder
            .Property(b => b.CustomerDocumentId)
            .HasColumnName(nameof(ConsultingSelectedDocumentReference.CustomerDocumentId).Underscore())
            .IsRequired();
    }
}
