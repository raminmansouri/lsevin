using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Specifications;

public sealed class CategoryByIdSpec(CategoryId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<CategoryDomain, CategoryId>(id, isReadOnly);
