using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Specifications;

public sealed class ActiveStaffSpec : SpecificationBase<Entities.Staff, StaffId>
{
    public ActiveStaffSpec(bool isReadOnly = false)
    {
        Query.Where(s => s.IsActive).AsNoTracking(isReadOnly);
    }
}
