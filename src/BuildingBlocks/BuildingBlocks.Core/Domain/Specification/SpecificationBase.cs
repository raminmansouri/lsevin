using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Specification;

/// <summary>
/// Represents the base class for specifications.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
/// <typeparam name="TId">The type of the entity identifier.</typeparam>
public abstract class SpecificationBase<T, TId> : Specification<T>, ISpecificationBase<T>
    where T : AggregateRoot<TId>
    where TId : TypedIdValueBase;

/// <summary>
/// Represents the base class for specifications with result transformation.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
/// <typeparam name="TId">The type of the entity identifier.</typeparam>
/// <typeparam name="TResult">The type of the result.</typeparam>
public abstract class SpecificationBase<T, TId, TResult> : Specification<T, TResult>, ISpecificationBase<T, TResult>
    where T : AggregateRoot<TId>
    where TId : TypedIdValueBase;
