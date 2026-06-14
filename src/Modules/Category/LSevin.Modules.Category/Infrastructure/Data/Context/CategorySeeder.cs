using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence.Context;
using LSevin.Modules.Category.Category.Entities;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceRequest.Enumerations;
using LSevin.Modules.Category.SharedKernel.Enumerations;
using LSevin.Modules.Category.Staff.Enumerations;
using LocationType = LSevin.Modules.Category.Location.Enumerations.LocationType;

namespace LSevin.Modules.Category.Infrastructure.Data.Context;

internal sealed class CategorySeeder(CategoryContext context) : IDbSeeder
{
    public Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!context.AttributeTypes.Any())
        {
            context.AttributeTypes.AddRange(Enumeration.GetAll<AttributeType>());
        }

        if (!context.StaffAvailabilityStatuses.Any())
        {
            context.StaffAvailabilityStatuses.AddRange(Enumeration.GetAll<StaffAvailabilityStatus>());
        }

        if (!context.LocationTypes.Any())
        {
            context.LocationTypes.AddRange(Enumeration.GetAll<LocationType>());
        }

        if (!context.ServiceProviderRequestStatuses.Any())
        {
            context.ServiceProviderRequestStatuses.AddRange(Enumeration.GetAll<ServiceProviderRequestStatus>());
        }

        if (!context.ServiceProviderGrades.Any())
        {
            context.ServiceProviderGrades.AddRange(Enumeration.GetAll<ServiceProviderGrade>());
        }

        if (!context.Currencies.Any())
        {
            context.Currencies.AddRange(Currency.Entities.Currency.Seed());
        }

        return context.SaveChangesAsync(cancellationToken);
    }
}
