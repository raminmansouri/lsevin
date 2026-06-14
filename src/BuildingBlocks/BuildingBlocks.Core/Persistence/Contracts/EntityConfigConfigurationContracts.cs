using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.Contracts;

/// <summary>
/// Represents the contract for configuring the data structure of an entity.
/// </summary>
/// <typeparam name="T">The type of the entity to configure.</typeparam>
public abstract class EntityConfigConfigurationContracts<T>
    where T : class
{
    /// <summary>
    /// Configures the data structure of the entity.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public abstract void ConfigDataStructure(EntityTypeBuilder<T> builder);

    /// <summary>
    /// Configures the relationships of the entity.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public virtual void ConfigRelationships(EntityTypeBuilder<T> builder) { }

    /// <summary>
    /// Configures the indexes of the entity.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public virtual void ConfigIndexes(EntityTypeBuilder<T> builder) { }
}
