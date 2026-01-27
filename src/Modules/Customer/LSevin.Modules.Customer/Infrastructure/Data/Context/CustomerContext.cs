using System.Reflection;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Persistence.EfCore.Postgres.Configurations;
using LSevin.Modules.Customer.Customer.Entities;
using LSevin.Modules.Customer.Customer.Enumerations;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Customer.Infrastructure.Data.Context;

internal sealed class CustomerContext(DbContextOptions<CustomerContext> options) : BaseEfDbContext(options)
{
    public const string DefaultSchema = "customer";

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasPostgresExtension(EfConstants.UuidGenerator);
        builder.HasDefaultSchema(DefaultSchema);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        builder.ApplyConfigurationsFromAssembly(typeof(StoredMessageConfiguration).Assembly);
        builder.ApplyConfigurationsFromAssembly(typeof(MessageConsumerConfiguration).Assembly);
    }

    public DbSet<Customer.Entities.Customer> Customers { get; set; } = null!;
    public DbSet<CustomerDocumentType> CustomerDocumentTypes { get; set; } = null!;
    public DbSet<CustomerDocument> CustomerDocuments { get; set; } = null!;
    public DbSet<Consulting.Entities.Consulting> Consultings { get; set; } = null!;
}
