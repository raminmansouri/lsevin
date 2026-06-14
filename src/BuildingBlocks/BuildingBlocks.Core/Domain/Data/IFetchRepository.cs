using System.Linq.Expressions;
using Ardalis.Specification;
using AutoMapper;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace BuildingBlocks.Core.Domain.Data;

/// <summary>
/// Provides a set of methods to fetch entities from the database with or without tracking, and to perform basic queries.
/// </summary>
/// <typeparam name="T">The type of the aggregate root.</typeparam>
public interface IFetchRepository<T>
    where T : IAggregateRoot
{
    /// <summary>
    /// Fetches multiple entities with tracking, optionally filtered by a predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <returns>An <see cref="IQueryable{T}"/> of entities.</returns>
    IQueryable<T> FetchMultiWithTracking(Expression<Func<T, bool>>? predicate = null);

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <returns>An <see cref="IQueryable{T}"/> of entities.</returns>
    IQueryable<T> FetchMulti(Expression<Func<T, bool>>? predicate = null);

    /// <summary>
    /// Fetches multiple entities with tracking, optionally filtered by a specification.
    /// </summary>
    /// <param name="specification">An optional specification to filter the entities.</param>
    /// <returns>An <see cref="IQueryable{T}"/> of entities.</returns>
    IQueryable<T> FetchMultiQuery(ISpecification<T> specification);

    /// <summary>
    /// Fetches multiple entities with tracking, optionally filtered by a specification.
    /// </summary>
    /// <typeparam name="TResult">The type of the selector.</typeparam>
    /// <param name="specification">The specification.</param>
    /// <returns>The list of entities.</returns>
    IQueryable<TResult> FetchMultiQuery<TResult>(ISpecification<T, TResult> specification);

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a specification.
    /// </summary>
    /// <param name="specification">An optional specification to filter the entities.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains a list of entities.</returns>
    Task<List<T>> FetchMultiAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a specification.
    /// </summary>
    /// <typeparam name="TResult">The type of the selector.</typeparam>
    /// <param name="specification">The specification.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<List<TResult>> FetchMultiAsync<TResult>(
        ISpecification<T, TResult> specification,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a specification.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<T>> FetchMultiAsync(IPageRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a specification.
    /// </summary>
    /// <param name="specification">An optional specification to filter the entities.</param>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<TResult>> FetchMultiAsync<TResult>(
        ISpecification<T, TResult> specification,
        IPageRequest request,
        CancellationToken cancellationToken = default
    )
        where TResult : class;

    /// <summary>
    /// Fetches multiple entities without tracking, optionally filtered by a specification.
    /// </summary>
    /// <param name="specification">An optional specification to filter the entities.</param>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<T>> FetchMultiAsync(
        ISpecification<T> specification,
        IPageRequest request,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Fetches multiple entities with sorting, optionally filtered by a specification.
    /// </summary>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sortExpression">The sort expression.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<T>> FetchMultiAsync<TSortKey>(
        IPageRequest pageRequest,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Fetches multiple entities with sorting, optionally filtered by a specification.
    /// </summary>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="configuration">The configuration provider.</param>
    /// <param name="sortExpression">The sort expression.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<TResult>> FetchMultiAsync<TResult, TSortKey>(
        IPageRequest pageRequest,
        IConfigurationProvider configuration,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class;

    /// <summary>
    /// Fetches multiple entities with sorting, optionally filtered by a specification.
    /// </summary>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="projectionFunc">The projection function.</param>
    /// <param name="sortExpression">The sort expression.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    Task<IPageList<TResult>> FetchMultiAsync<TResult, TSortKey>(
        IPageRequest pageRequest,
        Func<IQueryable<T>, IQueryable<TResult>> projectionFunc,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class;

    /// <summary>
    /// Projects the entities by the specified configuration.
    /// </summary>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="configuration">The configuration provider.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="sortExpression">The sort expression.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of entities.</returns>
    IAsyncEnumerable<TResult> ProjectByAsync<TResult, TSortKey>(
        IConfigurationProvider configuration,
        Expression<Func<T, bool>>? predicate = null,
        Expression<Func<T, TSortKey>>? sortExpression = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class;

    /// <summary>
    /// Determines whether any entity exists that satisfies a specified condition.
    /// </summary>
    /// <param name="predicate">A predicate to test each entity for a condition.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains <c>true</c> if any entities match the specified condition; otherwise, <c>false</c>.</returns>
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Determines whether any entity exists that satisfies a specified specification.
    /// </summary>
    /// <param name="specification">A specification to test each entity for a condition.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains <c>true</c> if any entities match the specified condition; otherwise, <c>false</c>.</returns>
    Task<bool> AnyAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches for an entity in the local cache that matches the specified predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <returns>The first entity found, or <c>null</c> if no entity matches the specified condition.</returns>
    T? LocalFirstOrDefault(Func<T, bool>? predicate = null);

    /// <summary>
    /// Loads a related entity or collection for the specified entity, as specified by a navigation property accessor function.
    /// </summary>
    /// <param name="entity">The entity to load the related entity or collection for.</param>
    /// <param name="navigation">A lambda expression representing the navigation property to be loaded.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains the entity, or <c>null</c> if the entity does not exist.</returns>
    Task<T?> LoadAsync(
        T? entity,
        Expression<Func<T, object>> navigation,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Searches for an entity that matches the specified predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains the first entity found, or <c>null</c> if no entity matches the specified condition.</returns>
    Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Searches for an entity that matches the specified specification.
    /// </summary>
    /// <param name="specification">A specification to filter the entities.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains the first entity found, or <c>null</c> if no entity matches the specified condition.</returns>
    Task<T?> FirstOrDefaultAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches for an entity that matches the specified specification.
    /// </summary>
    /// <typeparam name="TResult">The type of the selector.</typeparam>
    /// <param name="specification">The specification.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The first entity found, or <c>null</c> if no entity matches the specified condition.</returns>
    Task<TResult?> FirstOrDefaultAsync<TResult>(
        ISpecification<T, TResult> specification,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Gets the count of entities, optionally filtered by a predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <returns>The count of entities.</returns>
    int Count(Expression<Func<T, bool>>? predicate = null);

    /// <summary>
    /// Gets the count of entities, optionally filtered by a predicate.
    /// </summary>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains the count of entities.</returns>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of entities, optionally filtered by a specification.
    /// </summary>
    /// <param name="specification">An optional specification to filter the entities.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous operation. The task result contains the count of entities.</returns>
    Task<int> CountAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
}
