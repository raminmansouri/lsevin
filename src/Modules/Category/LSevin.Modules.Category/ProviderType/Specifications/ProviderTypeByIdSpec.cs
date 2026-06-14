using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Specifications;

public sealed class ProviderTypeByIdSpec(ProviderTypeId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<ProviderTypeDomain, ProviderTypeId>(id, isReadOnly);
