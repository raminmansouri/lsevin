using BuildingBlocks.Core.Persistence.Extensions;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Location.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.Location.Data.Configurations;

internal sealed class LocationTypeConfiguration : IEntityTypeConfiguration<LocationType>
{
    public void Configure(EntityTypeBuilder<LocationType> builder)
    {
        // Convert enumeration to table
        builder.ToTable(nameof(LocationType), CategoryContext.DefaultSchema);

        // Add enumeration data
        builder.HasData(LocationType.GetAll<LocationType>());

        // Configure properties
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id").ValueGeneratedNever().IsRequired();
        builder.Property(e => e.Name).HasMaxLength(50).HasColumnName("name").IsRequired();
    }
}
