using System.Linq.Expressions;
using Ardalis.Specification;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using BuildingBlocks.Core.Domain.Data;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Sieve.Models;
using Sieve.Services;

namespace BuildingBlocks.Core.Persistence.Repositories;

/// <summary>
/// Repository base class for managing entities of type <typeparamref name="T"/>.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="Repository{T, TId}"/> class.
/// </remarks>
/// <param name="dbContext">The database context.</param>
/// <param name="specificationEvaluator">The specification evaluator.</param>
/// <param name="sieveProcessor">The sieve processor.</param>
/// <typeparam name="T">The type of the entity.</typeparam>
/// <typeparam name="TId">The type of the entity identifier.</typeparam>
public class Repository<T, TId>(
    BaseEfDbContext dbContext,
    ISpecificationEvaluator specificationEvaluator,
    ISieveProcessor sieveProcessor
) : IRepository<T, TId>
    where T : AggregateRoot<TId>
    where TId : TypedIdValueBase
{
    private volatile bool _disposedValue;

    /// <summary>
    /// Gets the unit of work for the repository.
    /// </summary>
    public IUnitOfWork UnitOfWork => dbContext;

    #region Fetch

    /// <inheritdoc />
    public virtual IQueryable<T> FetchMultiWithTracking(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null ? dbContext.Set<T>() : dbContext.Set<T>().Where(predicate);
    }

    /// <inheritdoc />
    public virtual IQueryable<T> FetchMulti(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? dbContext.Set<T>().AsNoTracking()
            : dbContext.Set<T>().AsNoTracking().Where(predicate);
    }

    /// <inheritdoc />
    public virtual IQueryable<T> FetchMultiQuery(ISpecification<T> specification)
    {
        return ApplySpecification(specification);
    }

    /// <inheritdoc />
    public IQueryable<TResult> FetchMultiQuery<TResult>(ISpecification<T, TResult> specification)
    {
        return ApplySpecification(specification);
    }

    /// <inheritdoc />
    public virtual Task<List<T>> FetchMultiAsync(
        ISpecification<T> specification,
        CancellationToken cancellationToken = default
    )
    {
        return ApplySpecification(specification).ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public Task<List<TResult>> FetchMultiAsync<TResult>(
        ISpecification<T, TResult> specification,
        CancellationToken cancellationToken = default
    )
    {
        return ApplySpecification(specification).ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<T>> FetchMultiAsync(
        IPageRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var query = dbContext.Set<T>().AsNoTracking();

        // Apply Sieve filtering and sorting
        if (!string.IsNullOrEmpty(request.Filters) || !string.IsNullOrEmpty(request.SortOrder))
        {
            var sieveModel = new SieveModel
            {
                Filters = request.Filters,
                Sorts = request.SortOrder,
                Page = request.PageNumber,
                PageSize = request.PageSize,
            };

            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply pagination
        query = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize);

        var items = await query.ToListAsync(cancellationToken);

        return PageList<T>.Create(items, request.PageNumber, request.PageSize, total);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<T>> FetchMultiAsync(
        ISpecification<T> specification,
        IPageRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var query = ApplySpecification(specification).AsNoTracking();

        // Apply Sieve filtering and sorting
        if (!string.IsNullOrEmpty(request.Filters) || !string.IsNullOrEmpty(request.SortOrder))
        {
            var sieveModel = new SieveModel
            {
                Filters = request.Filters,
                Sorts = request.SortOrder,
                Page = request.PageNumber,
                PageSize = request.PageSize,
            };

            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply pagination
        query = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize);

        var items = await query.ToListAsync(cancellationToken);

        return PageList<T>.Create(items, request.PageNumber, request.PageSize, total);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<TResult>> FetchMultiAsync<TResult>(
        ISpecification<T, TResult> specification,
        IPageRequest request,
        CancellationToken cancellationToken = default
    )
        where TResult : class
    {
        var query = ApplySpecification(specification).AsNoTracking();

        // Apply Sieve filtering and sorting
        if (!string.IsNullOrEmpty(request.Filters) || !string.IsNullOrEmpty(request.SortOrder))
        {
            var sieveModel = new SieveModel
            {
                Filters = request.Filters,
                Sorts = request.SortOrder,
                Page = request.PageNumber,
                PageSize = request.PageSize,
            };

            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply pagination
        query = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize);

        var items = await query.ToListAsync(cancellationToken);

        return PageList<TResult>.Create(items, request.PageNumber, request.PageSize, total);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<T>> FetchMultiAsync<TSortKey>(
        IPageRequest pageRequest,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
    {
        var query = dbContext.Set<T>().AsNoTracking();

        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        query = query.OrderByDescending(sortExpression);

        var sieveModel = new SieveModel
        {
            Filters = pageRequest.Filters,
            Sorts = pageRequest.SortOrder,
            Page = pageRequest.PageNumber,
            PageSize = pageRequest.PageSize,
        };

        // Apply Sieve filtering
        if (!string.IsNullOrWhiteSpace(sieveModel.Filters))
        {
            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false, applySorting: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply pagination
        query = query.Skip((pageRequest.PageNumber - 1) * pageRequest.PageSize).Take(pageRequest.PageSize);

        var items = await query.ToListAsync(cancellationToken);

        return PageList<T>.Create(items, pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<TResult>> FetchMultiAsync<TResult, TSortKey>(
        IPageRequest pageRequest,
        IConfigurationProvider configuration,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class
    {
        var query = dbContext.Set<T>().AsNoTracking();

        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        query = query.OrderByDescending(sortExpression);

        var sieveModel = new SieveModel
        {
            Filters = pageRequest.Filters,
            Sorts = pageRequest.SortOrder,
            Page = pageRequest.PageNumber,
            PageSize = pageRequest.PageSize,
        };

        // Apply Sieve filtering
        if (!string.IsNullOrWhiteSpace(sieveModel.Filters))
        {
            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false, applySorting: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply pagination and projection
        var items = await query
            .Skip((pageRequest.PageNumber - 1) * pageRequest.PageSize)
            .Take(pageRequest.PageSize)
            .ProjectTo<TResult>(configuration)
            .ToListAsync(cancellationToken);

        return PageList<TResult>.Create(items, pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <inheritdoc />
    public virtual async Task<IPageList<TResult>> FetchMultiAsync<TResult, TSortKey>(
        IPageRequest pageRequest,
        Func<IQueryable<T>, IQueryable<TResult>> projectionFunc,
        Expression<Func<T, TSortKey>> sortExpression,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class
    {
        var query = dbContext.Set<T>().AsNoTracking();

        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        query = query.OrderByDescending(sortExpression);

        var sieveModel = new SieveModel
        {
            Filters = pageRequest.Filters,
            Sorts = pageRequest.SortOrder,
            Page = pageRequest.PageNumber,
            PageSize = pageRequest.PageSize,
        };

        // Apply Sieve filtering
        if (!string.IsNullOrWhiteSpace(sieveModel.Filters))
        {
            query = sieveProcessor.Apply(sieveModel, query, applyPagination: false, applySorting: false);
        }

        var total = await query.CountAsync(cancellationToken);

        // Apply custom projection function before pagination
        var projectedQuery = projectionFunc(query);

        // Apply pagination
        var items = await projectedQuery
            .Skip((pageRequest.PageNumber - 1) * pageRequest.PageSize)
            .Take(pageRequest.PageSize)
            .ToListAsync(cancellationToken);

        return PageList<TResult>.Create(items, pageRequest.PageNumber, pageRequest.PageSize, total);
    }

    /// <inheritdoc />
    public virtual IAsyncEnumerable<TResult> ProjectByAsync<TResult, TSortKey>(
        IConfigurationProvider configuration,
        Expression<Func<T, bool>>? predicate = null,
        Expression<Func<T, TSortKey>>? sortExpression = null,
        CancellationToken cancellationToken = default
    )
        where TResult : class
    {
        var query = dbContext.Set<T>().AsQueryable();

        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (sortExpression is not null)
        {
            query = query.OrderByDescending(sortExpression);
        }

        return query.ProjectTo<TResult>(configuration).ToAsyncEnumerable();
    }

    /// <inheritdoc />
    public virtual Task<bool> AnyAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.Set<T>().AsNoTracking().AnyAsync(predicate, cancellationToken);
    }

    /// <inheritdoc />
    public virtual Task<bool> AnyAsync(
        ISpecification<T> specification,
        CancellationToken cancellationToken = default
    ) => ApplySpecification(specification).AnyAsync(cancellationToken);

    /// <inheritdoc />
    public virtual async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
    {
        return predicate == null
            ? await dbContext.Set<T>().FirstOrDefaultAsync(cancellationToken)
            : await dbContext.Set<T>().FirstOrDefaultAsync(predicate, cancellationToken);
    }

    /// <inheritdoc />
    public virtual Task<T?> FirstOrDefaultAsync(
        ISpecification<T> specification,
        CancellationToken cancellationToken = default
    ) => ApplySpecification(specification).FirstOrDefaultAsync(cancellationToken);

    /// <inheritdoc />
    public Task<TResult?> FirstOrDefaultAsync<TResult>(
        ISpecification<T, TResult> specification,
        CancellationToken cancellationToken = default
    )
    {
        return ApplySpecification(specification).FirstOrDefaultAsync(cancellationToken);
    }

    /// <inheritdoc />
    public virtual T? LocalFirstOrDefault(Func<T, bool>? predicate = null)
    {
        return predicate == null
            ? dbContext.Set<T>().Local.FirstOrDefault()
            : dbContext.Set<T>().Local.FirstOrDefault(predicate);
    }

    /// <inheritdoc />
    public virtual async Task<T?> LoadAsync(
        T? entity,
        Expression<Func<T, object>> navigation,
        CancellationToken cancellationToken = default
    )
    {
        if (entity is null)
        {
            return null;
        }

        await dbContext.Entry(entity).Collection(navigation.GetPropertyAccess().Name).LoadAsync(cancellationToken);

        return entity;
    }

    /// <inheritdoc />
    public virtual int Count(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null ? dbContext.Set<T>().Count() : dbContext.Set<T>().Count(predicate);
    }

    /// <inheritdoc />
    public virtual async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default
    )
    {
        return predicate == null
            ? await dbContext.Set<T>().CountAsync(cancellationToken)
            : await dbContext.Set<T>().CountAsync(predicate, cancellationToken);
    }

    /// <inheritdoc />
    public virtual Task<int> CountAsync(
        ISpecification<T> specification,
        CancellationToken cancellationToken = default
    ) => ApplySpecification(specification, evaluateCriteriaOnly: true).CountAsync(cancellationToken);

    #endregion

    #region Save

    /// <inheritdoc />
    public virtual T Create(T item)
    {
        ArgumentNullException.ThrowIfNull(item);

        dbContext.Set<T>().Add(item);

        return item;
    }

    /// <inheritdoc />
    public virtual async Task<T> CreateAsync(T item, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(item);

        await dbContext.Set<T>().AddAsync(item, cancellationToken);

        return item;
    }

    /// <inheritdoc />
    public virtual IReadOnlyList<T> CreateRange(IEnumerable<T> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        var aggregateRoots = items as T[] ?? items.ToArray();
        dbContext.Set<T>().AddRange(aggregateRoots);

        return aggregateRoots;
    }

    /// <inheritdoc />
    public virtual async Task<IEnumerable<T>> CreateRangeAsync(
        IEnumerable<T> items,
        CancellationToken cancellationToken = default
    )
    {
        ArgumentNullException.ThrowIfNull(items);

        var rangeAsync = items as T[] ?? items.ToArray();
        await dbContext.Set<T>().AddRangeAsync(rangeAsync, cancellationToken);

        return rangeAsync;
    }

    /// <inheritdoc />
    public virtual void Update(T item)
    {
        ArgumentNullException.ThrowIfNull(item);

        dbContext.Set<T>().Update(item);
    }

    /// <inheritdoc />
    public virtual void UpdateRange(IEnumerable<T> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        dbContext.Set<T>().UpdateRange(items);
    }

    /// <inheritdoc />
    public virtual void UpdateWithAttach(T item)
    {
        ArgumentNullException.ThrowIfNull(item);

        dbContext.Entry(item).State = EntityState.Modified;
    }

    /// <inheritdoc />
    public virtual void UpdateRangeWithAttach(IEnumerable<T> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        var aggregateRoots = items as T[] ?? items.ToArray();
        dbContext.Set<T>().AttachRange(aggregateRoots);
        dbContext.Set<T>().UpdateRange(aggregateRoots);
    }

    #endregion

    #region Delete

    /// <inheritdoc />
    public virtual void Delete(T item)
    {
        dbContext.Set<T>().Remove(item);
    }

    /// <inheritdoc />
    public virtual void DeleteRange(IEnumerable<T> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        dbContext.Set<T>().RemoveRange(items);
    }

    /// <inheritdoc />
    public virtual void DeleteWithAttach(T item)
    {
        dbContext.Set<T>().Attach(item);
        dbContext.Set<T>().Remove(item);
    }

    /// <inheritdoc />
    public virtual void DeleteRangeWithAttach(IEnumerable<T> items)
    {
        var aggregateRoots = items as T[] ?? items.ToArray();
        dbContext.Set<T>().AttachRange(aggregateRoots);
        dbContext.Set<T>().RemoveRange(aggregateRoots);
    }

    #endregion

    #region Privates

    /// <summary>
    /// Applies a specification to the repository query.
    /// </summary>
    /// <param name="specification">The specification to apply.</param>
    /// <param name="evaluateCriteriaOnly">If true, only evaluates the criteria without including the includes/ordering.</param>
    /// <returns>An IQueryable with the specification applied.</returns>
    protected virtual IQueryable<T> ApplySpecification(
        ISpecification<T> specification,
        bool evaluateCriteriaOnly = false
    )
    {
        return specificationEvaluator.GetQuery(dbContext.Set<T>(), specification, evaluateCriteriaOnly);
    }

    /// <summary>
    /// Applies a specification that transforms the query result to a different type.
    /// </summary>
    /// <typeparam name="TResult">The type to transform the query result to.</typeparam>
    /// <param name="specification">The specification to apply.</param>
    /// <returns>An IQueryable of the transformed type with the specification applied.</returns>
    protected virtual IQueryable<TResult> ApplySpecification<TResult>(ISpecification<T, TResult> specification)
    {
        return specificationEvaluator.GetQuery(dbContext.Set<T>(), specification);
    }

    #endregion

    #region Dispose

    /// <summary>
    /// Disposes the resources used by the <see cref="Repository{T,TId}"/> class.
    /// </summary>
    /// <param name="disposing">A value indicating whether the object is being disposed.</param>
    private void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                dbContext.Dispose();
            }

            _disposedValue = true;
        }
    }

    /// <summary>
    /// Disposes the resources used by the <see cref="Repository{T,TId}"/> class.
    /// </summary>
    /// <param name="disposing">A value indicating whether the object is being disposed.</param>
    private async Task DisposeAsync(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing)
            {
                await dbContext.DisposeAsync();
            }

            _disposedValue = true;
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        await DisposeAsync(disposing: true);
        GC.SuppressFinalize(this);
    }

    #endregion
}
