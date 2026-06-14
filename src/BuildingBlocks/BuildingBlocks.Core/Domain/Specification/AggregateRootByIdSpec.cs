using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Specification;

public abstract class AggregateRootByIdSpec<TAggregate, TId>
    : SpecificationBase<TAggregate, TId>,
        ISingleResultSpecification<TAggregate>
    where TAggregate : AggregateRoot<TId>
    where TId : TypedIdValueBase
{
    protected AggregateRootByIdSpec(TId id, bool isReadOnly = false)
    {
        Query.Where(aggregate => aggregate.Id == id).AsNoTracking(isReadOnly);
    }
}
