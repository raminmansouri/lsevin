using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Data.Repository;

public interface IServiceDefinitionRepository : IRepository<ServiceDefinitionDomain, ServiceDefinitionId>;
