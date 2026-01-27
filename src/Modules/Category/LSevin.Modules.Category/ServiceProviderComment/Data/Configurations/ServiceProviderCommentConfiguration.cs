using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProviderComment.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceProviderComment.Data.Configurations;

internal sealed class ServiceProviderCommentConfiguration
    : EntityConfigConfigurationContracts<Entities.ServiceProviderComment>,
        IEntityTypeConfiguration<Entities.ServiceProviderComment>
{
    public void Configure(EntityTypeBuilder<Entities.ServiceProviderComment> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<Entities.ServiceProviderComment> builder)
    {
        builder.ConfigureEntity<Entities.ServiceProviderComment, ServiceProviderCommentId>(
            nameof(Entities.ServiceProviderComment).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(c => c.ServiceProviderId)
            .HasColumnName(nameof(Entities.ServiceProviderComment.ServiceProviderId).Underscore())
            .IsRequired();

        builder
            .Property(c => c.CustomerId)
            .HasColumnName(nameof(Entities.ServiceProviderComment.CustomerId).Underscore())
            .IsRequired();

        builder
            .Property(c => c.CustomerName)
            .HasColumnName(nameof(Entities.ServiceProviderComment.CustomerName).Underscore())
            .HasMaxLength(GlobalDomainConstValues.FirstNameMaxLength + GlobalDomainConstValues.LastNameMaxLength)
            .IsRequired();

        builder
            .Property(c => c.CommentText)
            .HasColumnName(nameof(Entities.ServiceProviderComment.CommentText).Underscore())
            .HasMaxLength(DomainConstValues.ServiceProviderCommentTextMaxLength)
            .IsRequired();

        builder
            .Property(c => c.Rating)
            .HasColumnName(nameof(Entities.ServiceProviderComment.Rating).Underscore())
            .IsRequired(false); // Nullable

        builder
            .Property(c => c.IsPublic)
            .HasColumnName(nameof(Entities.ServiceProviderComment.IsPublic).Underscore())
            .HasDefaultValue(true)
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<Entities.ServiceProviderComment> builder)
    {
        builder
            .HasOne<ServiceProvider.Entities.ServiceProvider>()
            .WithMany()
            .HasForeignKey(c => c.ServiceProviderId)
            .OnDelete(DeleteBehavior.Cascade); // Delete comments when provider is deleted
    }

    public override void ConfigIndexes(EntityTypeBuilder<Entities.ServiceProviderComment> builder)
    {
        builder.HasIndex(c => c.ServiceProviderId);
        builder.HasIndex(c => c.CustomerId);
        builder.HasIndex(c => new { c.ServiceProviderId, c.IsPublic }); // For public comments query
        builder.HasIndex(c => c.CreateDate); // For ordering
    }

    #endregion
}
