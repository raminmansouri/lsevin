using System.Linq.Expressions;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using Microsoft.EntityFrameworkCore;
using Sieve.Models;
using Sieve.Services;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Represents the queryable extensions.
/// </summary>
public static class QueryableExtensions
{
    /// <summary>
    /// Applies the paging asynchronous.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <param name="queryable">The queryable.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<IPageList<TEntity>> ApplyPagingAsync<TEntity>(
        this IQueryable<TEntity> queryable,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        CancellationToken cancellationToken
    )
        where TEntity : class
    {
        var sieveModel = new SieveModel
        {
            PageSize = pageRequest.PageSize,
            Page = pageRequest.PageNumber,
            Sorts = pageRequest.SortOrder,
            Filters = pageRequest.Filters,
        };

        // https://github.com/Biarity/Sieve/issues/34#issuecomment-403817573
        var result = sieveProcessor.Apply(sieveModel, queryable, applyPagination: false);
#pragma warning disable AsyncFixer02
        // The provider for the source 'IQueryable' doesn't implement 'IAsyncQueryProvider'. Only providers that implement 'IAsyncQueryProvider' can be used for Entity Framework asynchronous operations.
        var total = result.Count();
#pragma warning restore AsyncFixer02
        result = sieveProcessor.Apply(sieveModel, queryable, applyFiltering: false, applySorting: false);

        var items = await result.AsNoTracking().ToAsyncEnumerable().ToListAsync(cancellationToken: cancellationToken);

        return PageList<TEntity>.Create(items.AsReadOnly(), pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <summary>
    /// Applies the paging asynchronous.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="queryable">The queryable.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="configurationProvider">The configuration provider.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<IPageList<TResult>> ApplyPagingAsync<TEntity, TResult>(
        this IQueryable<TEntity> queryable,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        IConfigurationProvider configurationProvider,
        CancellationToken cancellationToken
    )
        where TEntity : class
        where TResult : class
    {
        var sieveModel = new SieveModel
        {
            PageSize = pageRequest.PageSize,
            Page = pageRequest.PageNumber,
            Sorts = pageRequest.SortOrder,
            Filters = pageRequest.Filters,
        };

        // https://github.com/Biarity/Sieve/issues/34#issuecomment-403817573
        var result = sieveProcessor.Apply(sieveModel, queryable, applyPagination: false);
#pragma warning disable AsyncFixer02
        // The provider for the source 'IQueryable' doesn't implement 'IAsyncQueryProvider'. Only providers that implement 'IAsyncQueryProvider' can be used for Entity Framework asynchronous operations.
        var total = result.Count();
#pragma warning restore AsyncFixer02
        result = sieveProcessor.Apply(sieveModel, queryable, applyFiltering: false, applySorting: false); // Only applies pagination

        var projectedQuery = result.ProjectTo<TResult>(configurationProvider);

        var items = await projectedQuery
            .AsNoTracking()
            .ToAsyncEnumerable()
            .ToListAsync(cancellationToken: cancellationToken);

        return PageList<TResult>.Create(items.AsReadOnly(), pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <summary>
    /// Applies the paging asynchronous.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="queryable">The queryable.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="projectionFunc">The projection function.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<IPageList<TResult>> ApplyPagingAsync<TEntity, TResult>(
        this IQueryable<TEntity> queryable,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        Func<IQueryable<TEntity>, IQueryable<TResult>> projectionFunc,
        CancellationToken cancellationToken
    )
        where TEntity : class
        where TResult : class
    {
        var sieveModel = new SieveModel
        {
            PageSize = pageRequest.PageSize,
            Page = pageRequest.PageNumber,
            Sorts = pageRequest.SortOrder,
            Filters = pageRequest.Filters,
        };

        // https://github.com/Biarity/Sieve/issues/34#issuecomment-403817573
        var result = sieveProcessor.Apply(sieveModel, queryable, applyPagination: false);
#pragma warning disable AsyncFixer02
        // The provider for the source 'IQueryable' doesn't implement 'IAsyncQueryProvider'. Only providers that implement 'IAsyncQueryProvider' can be used for Entity Framework asynchronous operations.
        var total = result.Count();
#pragma warning restore AsyncFixer02
        result = sieveProcessor.Apply(sieveModel, queryable, applyFiltering: false, applySorting: false); // Only applies pagination

        var projectedQuery = projectionFunc(result);

        var items = await projectedQuery
            .AsNoTracking()
            .ToAsyncEnumerable()
            .ToListAsync(cancellationToken: cancellationToken);

        return PageList<TResult>.Create(items.AsReadOnly(), pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <summary>
    /// Applies the paging asynchronous.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="projectionFunc">The projection function.</param>
    /// <param name="predicate">The predicate.</param>
    /// <param name="sortExpression">The sort expression.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<IPageList<TResult>> ApplyPagingAsync<TEntity, TResult, TSortKey>(
        this IQueryable<TEntity> collection,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        Func<IQueryable<TEntity>, IQueryable<TResult>> projectionFunc,
        Expression<Func<TEntity, bool>>? predicate = null,
        Expression<Func<TEntity, TSortKey>>? sortExpression = null,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
        where TResult : class
    {
        IQueryable<TEntity> query = collection;
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (sortExpression is not null)
        {
            query = query.OrderByDescending(sortExpression);
        }

        return await query.ApplyPagingAsync(pageRequest, sieveProcessor, projectionFunc, cancellationToken);
    }

    public static async Task<IPageList<TResult>> ApplyPagingAsync<TEntity, TResult>(
        this IQueryable<TEntity> queryable,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        Func<TEntity, TResult> map,
        CancellationToken cancellationToken
    )
        where TEntity : class
        where TResult : class
    {
        var sieveModel = new SieveModel
        {
            PageSize = pageRequest.PageSize,
            Page = pageRequest.PageNumber,
            Sorts = pageRequest.SortOrder,
            Filters = pageRequest.Filters,
        };

        // https://github.com/Biarity/Sieve/issues/34#issuecomment-403817573
        var result = sieveProcessor.Apply(sieveModel, queryable, applyPagination: false);
#pragma warning disable AsyncFixer02
        // The provider for the source 'IQueryable' doesn't implement 'IAsyncQueryProvider'. Only providers that implement 'IAsyncQueryProvider' can be used for Entity Framework asynchronous operations.
        var total = result.Count();
#pragma warning restore AsyncFixer02
        result = sieveProcessor.Apply(sieveModel, queryable, applyFiltering: false, applySorting: false); // Only applies pagination

        var items = await result
            .Select(x => map(x))
            .AsNoTracking()
            .ToAsyncEnumerable()
            .ToListAsync(cancellationToken: cancellationToken);

        return PageList<TResult>.Create(items.AsReadOnly(), pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <summary>
    /// Applies paging to the specified collection.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="collection">The collection to apply paging to.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="configuration">The configuration provider.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="sortExpression">An optional expression to sort the entities.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static Task<IPageList<TResult>> ApplyPagingAsync<TEntity, TResult, TSortKey>(
        this IQueryable<TEntity> collection,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        IConfigurationProvider configuration,
        Expression<Func<TEntity, bool>>? predicate = null,
        Expression<Func<TEntity, TSortKey>>? sortExpression = null,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
        where TResult : class
    {
        IQueryable<TEntity> query = collection;
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (sortExpression is not null)
        {
            query = query.OrderByDescending(sortExpression);
        }

        return query.ApplyPagingAsync<TEntity, TResult>(pageRequest, sieveProcessor, configuration, cancellationToken);
    }

    /// <summary>
    /// Applies paging to the specified collection.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <typeparam name="TSortKey">The type of the sort key.</typeparam>
    /// <param name="collection">The collection to apply paging to.</param>
    /// <param name="pageRequest">The page request.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="predicate">An optional predicate to filter the entities.</param>
    /// <param name="sortExpression">An optional expression to sort the entities.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<IPageList<TEntity>> ApplyPagingAsync<TEntity, TSortKey>(
        this IQueryable<TEntity> collection,
        IPageRequest pageRequest,
        ISieveProcessor sieveProcessor,
        Expression<Func<TEntity, bool>>? predicate = null,
        Expression<Func<TEntity, TSortKey>>? sortExpression = null,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
    {
        IQueryable<TEntity> query = collection;
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (sortExpression is not null)
        {
            query = query.OrderByDescending(sortExpression);
        }

        return await query.ApplyPagingAsync(pageRequest, sieveProcessor, cancellationToken);
    }
}
