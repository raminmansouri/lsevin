using System.Linq.Expressions;
using AutoMapper.QueryableExtensions;
using BuildingBlocks.Core.Linq;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using Microsoft.EntityFrameworkCore;
using IConfigurationProvider = AutoMapper.IConfigurationProvider;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Represents the EF Core queryable extensions.
/// </summary>
public static class EfCoreQueryableExtensions
{
    public static async Task<ListResultModel<T>> ApplyPagingAsync<T>(
        this IQueryable<T> collection,
        int page = PageConstants.DefaultPageNumber,
        int pageSize = PageConstants.DefaultPageSize,
        CancellationToken cancellationToken = default
    )
        where T : notnull
    {
        if (page <= 0)
            page = PageConstants.DefaultPageNumber;

        if (pageSize <= 0)
            pageSize = PageConstants.DefaultPageSize;

        var isEmpty = !await collection.AnyAsync(cancellationToken: cancellationToken);
        if (isEmpty)
            return ListResultModel<T>.Empty;

        var totalItems = await collection.CountAsync(cancellationToken: cancellationToken);

        var data = await collection.Limit(page, pageSize).ToListAsync(cancellationToken: cancellationToken);

        return ListResultModel<T>.Create(data, totalItems, page, pageSize);
    }

    /// <summary>
    /// Applies the paging asynchronous.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <typeparam name="TR">The type of the result.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="page">The page.</param>
    /// <param name="pageSize">Size of the page.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The page list.</returns>
    public static async Task<ListResultModel<TR>> ApplyPagingAsync<T, TR>(
        this IQueryable<T> collection,
        IConfigurationProvider configuration,
        int page = PageConstants.DefaultPageNumber,
        int pageSize = PageConstants.DefaultPageSize,
        CancellationToken cancellationToken = default
    )
        where TR : notnull
    {
        if (page <= 0)
            page = PageConstants.DefaultPageNumber;

        if (pageSize <= 0)
            pageSize = PageConstants.DefaultPageSize;

        var isEmpty = !await collection.AnyAsync(cancellationToken: cancellationToken);
        if (isEmpty)
            return ListResultModel<TR>.Empty;

        var totalItems = await collection.CountAsync(cancellationToken: cancellationToken);

        var data = await collection
            .Limit(page, pageSize)
            .ProjectTo<TR>(configuration)
            .ToListAsync(cancellationToken: cancellationToken);

        return ListResultModel<TR>.Create(data, totalItems, page, pageSize);
    }

    public static IQueryable<TEntity> ApplyPaging<TEntity>(this IQueryable<TEntity> source, int page, int size)
        where TEntity : class
    {
        return source.Skip(page * size).Take(size);
    }

    /// <summary>
    /// Limits the specified collection.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="page">The page.</param>
    /// <param name="resultsPerPage">The results per page.</param>
    /// <returns>The limited collection.</returns>
    public static IQueryable<T> Limit<T>(this IQueryable<T> collection, int page = 1, int resultsPerPage = 10)
    {
        if (page <= 0)
            page = 1;

        if (resultsPerPage <= 0)
            resultsPerPage = 10;

        var skip = (page - 1) * resultsPerPage;
        var data = collection.Skip(skip).Take(resultsPerPage);

        return data;
    }

    /// <summary>
    /// Applies the filter.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <param name="source">The source.</param>
    /// <param name="filters">The filters.</param>
    /// <returns>The filtered collection.</returns>
    public static IQueryable<TEntity> ApplyFilter<TEntity>(
        this IQueryable<TEntity> source,
        IEnumerable<FilterModel>? filters
    )
        where TEntity : class
    {
        if (filters is null)
            return source;

        List<Expression<Func<TEntity, bool>>> filterExpressions = new List<Expression<Func<TEntity, bool>>>();

        foreach (var (fieldName, comparision, fieldValue) in filters)
        {
            Expression<Func<TEntity, bool>> expr = PredicateBuilder.Build<TEntity>(fieldName, comparision, fieldValue);

            filterExpressions.Add(expr);
        }

        return source.Where(filterExpressions.Aggregate((expr1, expr2) => expr1.And(expr2)));
    }

    /// <summary>
    /// Applies the include list.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <param name="source">The source.</param>
    /// <param name="navigationPropertiesPath">The navigation properties path.</param>
    /// <returns>The included collection.</returns>
    public static IQueryable<TEntity> ApplyIncludeList<TEntity>(
        this IQueryable<TEntity> source,
        IEnumerable<string>? navigationPropertiesPath
    )
        where TEntity : class
    {
        if (navigationPropertiesPath is null)
            return source;

        return navigationPropertiesPath.Aggregate(
            source,
            (current, navigationPropertyPath) => current.Include(navigationPropertyPath)
        );
    }
}
