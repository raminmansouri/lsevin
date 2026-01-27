using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Persistence.EfCore.Postgres;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class DbContextDesignFactory()
    : DbContextDesignFactoryBase<IdentityContext>(
        IdentityContext.DefaultSchema,
        EfConstants.SqlConnectionStringName,
        IdentityReference.Assembly
    );
