using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class IdentityMigrator(IdentityContext context) : IDbMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        return context.Database.MigrateAsync(cancellationToken);
    }
}
