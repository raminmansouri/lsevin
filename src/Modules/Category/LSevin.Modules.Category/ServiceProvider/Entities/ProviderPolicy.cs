using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ProviderPolicy : Entity<ProviderPolicyId>
{
    #region Constructors

    private ProviderPolicy()
    {
        Type = null!;
        Description = null!;
    }

    private ProviderPolicy(LocalizedString type, LocalizedString description)
        : this()
    {
        Id = ProviderPolicyId.Create(IdGenerator.NewId());
        Type = type;
        Description = description;
    }

    #endregion

    #region Properties

    public LocalizedString Type { get; private set; }
    public LocalizedString Description { get; private set; }

    #endregion

    #region Methods

    public static ProviderPolicy Create(LocalizedString type, LocalizedString description)
    {
        Guard.Against.Null(type, nameof(type));
        Guard.Against.Null(description, nameof(description));

        return new ProviderPolicy(type, description);
    }

    public void Update(LocalizedString type, LocalizedString description)
    {
        Guard.Against.Null(type, nameof(type));
        Guard.Against.Null(description, nameof(description));

        Type = type;
        Description = description;
    }

    #endregion
}
