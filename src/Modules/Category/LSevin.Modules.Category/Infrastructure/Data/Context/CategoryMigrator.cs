using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Category.Infrastructure.Data.Context;

internal sealed class CategoryMigrator(CategoryContext context) : IDbMigrator
{
    public Task MigrateAsync(CancellationToken cancellationToken = default)
    {
         context.Database.Migrate();
         return Task.FromResult(true);
    }
}
