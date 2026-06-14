using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using LSevin.Modules.Category.ServiceDefinition.Rule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceDefinition.ValueObjects;

public sealed class ServiceRequirement : ValueObject
{
    public LocalizedString Description { get; }
    public bool IsMandatory { get; }

    private ServiceRequirement()
    {
        Description = null!;
    }

    [JsonConstructor]
    private ServiceRequirement(LocalizedString description, bool isMandatory)
        : this()
    {
        Description = description;
        IsMandatory = isMandatory;
    }

    public static ServiceRequirement Create(LocalizedString description, bool isMandatory)
    {
        Guard.Against.Null(description, nameof(description));

        CheckRule(new ServiceRequirementDescriptionMustNotBeEmptyRule(description.DefaultValue));

        return new ServiceRequirement(description, isMandatory);
    }

    public void Deconstruct(out LocalizedString description, out bool isMandatory)
    {
        description = Description;
        isMandatory = IsMandatory;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Description;
        yield return IsMandatory;
    }
}

public static partial class EntityConfiguration
{
    public static void Configure<T>(this OwnedNavigationBuilder<T, ServiceRequirement> builder)
        where T : class
    {
        builder
            .Property(p => p.Description)
            .ConfigureLocalizedStringNonNullable<T>(
                nameof(ServiceRequirement.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.ServiceRequirementDescriptionMaxLength * 10
            );

        builder
            .Property(p => p.IsMandatory)
            .HasColumnName(nameof(ServiceRequirement.IsMandatory).Underscore())
            .IsRequired();
    }
}
