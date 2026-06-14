using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Data.Repository;

public interface IProviderTypeRepository : IRepository<ProviderTypeDomain, ProviderTypeId>;
