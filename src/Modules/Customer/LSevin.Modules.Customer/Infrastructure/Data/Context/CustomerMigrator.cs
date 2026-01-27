using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Customer.Infrastructure.Data.Context;

internal sealed class CustomerMigrator(CustomerContext context) : IDbMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        return context.Database.MigrateAsync(cancellationToken);
    }
}
