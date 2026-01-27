using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository;

public interface IServiceProviderRepository : IRepository<Entities.ServiceProvider, ServiceProviderId>;
