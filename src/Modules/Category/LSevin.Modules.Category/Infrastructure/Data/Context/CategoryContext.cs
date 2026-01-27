using System.Reflection;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Persistence.EfCore.Postgres.Configurations;
using LSevin.Modules.Category.Location.Entities;
using LSevin.Modules.Category.Location.Enumerations;
using LSevin.Modules.Category.ProviderType.Entities;
using LSevin.Modules.Category.ServiceDefinition.Entities;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceRequest.Entities;
using LSevin.Modules.Category.ServiceRequest.Enumerations;
using LSevin.Modules.Category.SharedKernel.Enumerations;
using LSevin.Modules.Category.Staff.Entities;
using LSevin.Modules.Category.Staff.Enumerations;
using Microsoft.EntityFrameworkCore;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.Infrastructure.Data.Context;

internal sealed class CategoryContext(DbContextOptions<CategoryContext> options) : BaseEfDbContext(options)
{
    public const string DefaultSchema = "category";

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasPostgresExtension(EfConstants.UuidGenerator);
        builder.HasDefaultSchema(DefaultSchema);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        builder.ApplyConfigurationsFromAssembly(typeof(StoredMessageConfiguration).Assembly);
        builder.ApplyConfigurationsFromAssembly(typeof(MessageConsumerConfiguration).Assembly);
    }

    public DbSet<Category.Entities.Category> Categories { get; set; } = null!;

    // ServiceDefinition aggregate
    public DbSet<ServiceDefinition.Entities.ServiceDefinition> ServiceDefinitions { get; set; } = null!;
    public DbSet<ServiceAttributeDefinition> ServiceAttributeDefinitions { get; set; } = null!;

    // ProviderType aggregate
    public DbSet<ProviderTypeDomain> ProviderTypes { get; set; } = null!;
    public DbSet<ProviderAttributeDefinition> ProviderAttributeDefinitions { get; set; } = null!;

    // Shared enumerations
    public DbSet<AttributeType> AttributeTypes { get; set; } = null!;

    // Staff aggregate
    public DbSet<Staff.Entities.Staff> Staffs { get; set; } = null!;
    public DbSet<StaffAvailability> StaffAvailabilities { get; set; } = null!;
    public DbSet<StaffService> StaffServices { get; set; } = null!;
    public DbSet<StaffAvailabilityStatus> StaffAvailabilityStatuses { get; set; } = null!;

    public DbSet<ServiceProvider.Entities.ServiceProvider> ServiceProviders { get; set; } = null!;
    public DbSet<ProviderAttribute> ProviderAttributes { get; set; } = null!;
    public DbSet<ProviderService> ProviderServices { get; set; } = null!;
    public DbSet<ServiceProviderGrade> ServiceProviderGrades { get; set; } = null!;
    public DbSet<ProviderGalleryItem> ProviderGalleryItems { get; set; } = null!;
    public DbSet<ProviderPolicy> ProviderPolicies { get; set; } = null!;
    public DbSet<ProviderStaff> ProviderStaffMembers { get; set; } = null!;
    public DbSet<ServiceProviderRequest> ServiceProviderRequests { get; set; } = null!;
    public DbSet<ServiceProviderRequestStatus> ServiceProviderRequestStatuses { get; set; } = null!;

    // Location aggregate
    public DbSet<Location.Entities.Location> Locations { get; set; } = null!;
    public DbSet<LocationType> LocationTypes { get; set; } = null!;
}
