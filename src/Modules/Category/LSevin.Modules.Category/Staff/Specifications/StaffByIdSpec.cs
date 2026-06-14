using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Specifications;

public sealed class StaffByIdSpec(StaffId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<Entities.Staff, StaffId>(id, isReadOnly);
