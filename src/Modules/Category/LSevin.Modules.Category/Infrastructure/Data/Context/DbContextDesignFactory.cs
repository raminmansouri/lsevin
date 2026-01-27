using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Persistence.EfCore.Postgres;

namespace LSevin.Modules.Category.Infrastructure.Data.Context;

internal sealed class DbContextDesignFactory()
    : DbContextDesignFactoryBase<CategoryContext>(
        CategoryContext.DefaultSchema,
        EfConstants.SqlConnectionStringName,
        CategoryReference.Assembly
    );
