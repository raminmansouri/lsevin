using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class IdentityMigrator(IdentityContext context) : IDbMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken = default)
    {
         context.Database.Migrate();
         return Task.FromResult(true);
    }
}
