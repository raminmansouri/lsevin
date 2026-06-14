using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Specification;

/// <summary>
/// Represents the base interface for all specifications.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
public interface ISpecificationBase<T> : ISpecification<T>
    where T : IAggregateRoot;

/// <summary>
/// Represents the base interface for all specifications.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
/// <typeparam name="TResult">The type of the result.</typeparam>
public interface ISpecificationBase<T, TResult> : ISpecification<T, TResult>
    where T : IAggregateRoot;
