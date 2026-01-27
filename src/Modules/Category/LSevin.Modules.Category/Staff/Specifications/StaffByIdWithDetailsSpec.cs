using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Specifications;

public sealed class StaffByIdWithDetailsSpec
    : SpecificationBase<Entities.Staff, StaffId>,
        ISingleResultSpecification<Entities.Staff>
{
    public StaffByIdWithDetailsSpec(StaffId id, bool isReadOnly = false)
    {
        Query
            .Where(s => s.Id == id)
            .Include(s => s.Services)
            .Include(s => s.Availabilities)
            .AsSplitQuery()
            .AsNoTracking(isReadOnly);
    }
}
