using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Persistence.EfCore.Postgres;

namespace LSevin.Modules.Customer.Infrastructure.Data.Context;

internal sealed class DbContextDesignFactory()
    : DbContextDesignFactoryBase<CustomerContext>(
        CustomerContext.DefaultSchema,
        EfConstants.SqlConnectionStringName,
        CustomerReference.Assembly
    );
