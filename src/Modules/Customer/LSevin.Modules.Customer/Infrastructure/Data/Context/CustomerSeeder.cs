using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence.Context;
using LSevin.Modules.Customer.Customer.Enumerations;

namespace LSevin.Modules.Customer.Infrastructure.Data.Context;

internal sealed class CustomerSeeder(CustomerContext context) : IDbSeeder
{
    public Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!context.CustomerDocumentTypes.Any())
        {
            context.CustomerDocumentTypes.AddRange(Enumeration.GetAll<CustomerDocumentType>());
        }

        return context.SaveChangesAsync(cancellationToken);
    }
}
