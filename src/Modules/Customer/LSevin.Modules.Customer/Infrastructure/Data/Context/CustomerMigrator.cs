using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Customer.Infrastructure.Data.Context;

internal sealed class CustomerMigrator(CustomerContext context) : IDbMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken = default)
    {
         context.Database.Migrate();
         return Task.FromResult(true);
    }
}
