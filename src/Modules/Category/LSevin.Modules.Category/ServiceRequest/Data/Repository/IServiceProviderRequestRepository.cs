using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;

namespace LSevin.Modules.Category.ServiceRequest.Data.Repository;

public interface IServiceProviderRequestRepository
    : IRepository<Entities.ServiceProviderRequest, ServiceProviderRequestId>;
