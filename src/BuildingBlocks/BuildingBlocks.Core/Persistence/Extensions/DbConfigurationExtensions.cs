using BuildingBlocks.Core.Domain.Primitives;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Represents the database configuration extensions.
/// </summary>
public static class DbConfigurationExtensions
{
    /// <summary>
    /// Configures the entity.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <typeparam name="TId">The type of the identifier.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="tableName">Name of the table.</param>
    /// <param name="schema">The schema.</param>
    public static void ConfigureEntity<T, TId>(this EntityTypeBuilder<T> builder, string tableName, string schema)
        where T : Entity<TId>
        where TId : TypedIdValueBase
    {
        builder.ToTable(tableName.Pluralize().Underscore(), schema);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.HasKey(x => x.Id);
    }

    /// <summary>
    /// Configures the enumeration.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="tableName">The table name.</param>
    /// <param name="schemaName">The schema name.</param>
    public static void ConfigureEnumeration<T>(this EntityTypeBuilder<T> builder, string tableName, string schemaName)
        where T : Enumeration
    {
        builder.ToTable(tableName.Pluralize().Underscore(), schemaName);
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).ValueGeneratedNever().IsRequired();
        builder.Property(b => b.Name).HasMaxLength(EfConstants.Lenght.Small).IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    /// <param name="columnName">The name of the column to be used for the property.</param>
    /// <typeparam name="T">The type of the property.</typeparam>
    public static void ConfigureEnumProperty<T>(this PropertyBuilder<T> builder, string columnName)
        where T : Enumeration
    {
        builder
            .HasConversion(v => v.Name, v => Enumeration.FromDisplayName<T>(v))
            .HasColumnName(columnName.Underscore())
            .HasMaxLength(EfConstants.Lenght.Small)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    /// <param name="columnName">The name of the column to be used for the property.</param>
    /// <typeparam name="T">The type of the property.</typeparam>
    public static void ConfigureNullableEnumProperty<T>(this PropertyBuilder<T?> builder, string columnName)
        where T : Enumeration
    {
        builder
            .HasConversion(v => v != null ? v.Name : null, v => v != null ? Enumeration.FromDisplayName<T>(v) : null)
            .HasColumnName(columnName.Underscore())
            .HasMaxLength(EfConstants.Lenght.Small)
            .IsRequired(false);
    }

    /// <summary>
    /// Configures the entity.
    /// </summary>
    /// <typeparam name="TDomain">The type of the domain entity.</typeparam>
    /// <typeparam name="TDomainId">The type of the domain entity identifier.</typeparam>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="tableName">The table name.</param>
    /// <param name="schemaName">The schema name.</param>
    /// <param name="parentIdentifierName">The identifier name.</param>
    /// <param name="initialConfig">The configure action.</param>
    public static void ConfigureOwnedNavigatorEntity<TDomain, TDomainId, TEntity>(
        this OwnedNavigationBuilder<TDomain, TEntity> builder,
        string tableName,
        string schemaName,
        string parentIdentifierName,
        Action<OwnedNavigationBuilder<TDomain, TEntity>>? initialConfig = null
    )
        where TDomain : Entity
        where TEntity : class
    {
        builder.ToTable(tableName.Pluralize().Underscore(), schemaName);

        builder.Property<TDomainId>(parentIdentifierName).HasColumnName(parentIdentifierName.Underscore()).IsRequired();

        initialConfig?.Invoke(builder);

        builder.WithOwner().HasForeignKey(parentIdentifierName);
    }
}
