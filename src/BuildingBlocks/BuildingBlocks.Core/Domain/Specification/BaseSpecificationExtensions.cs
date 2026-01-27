using System.Linq.Expressions;
using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace BuildingBlocks.Core.Domain.Specification;

/// <summary>
/// Provides extension methods for specifications.
/// </summary>
public static class BaseSpecificationExtensions
{
    /// <summary>
    /// Applies by identifier to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <typeparam name="TId">The type of the entity identifier.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="id">The identifier.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> ApplyById<T, TId>(this ISpecificationBuilder<T> builder, TId id)
        where T : AggregateRoot<TId>
        where TId : TypedIdValueBase
    {
        return builder.Where(x => x.Id == id);
    }

    /// <summary>
    /// Applies default ordering to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <typeparam name="TId">The type of the entity identifier.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="orderByDesc">The order by desc.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> ApplyDefaultOrdering<T, TId>(
        this ISpecificationBuilder<T> builder,
        bool orderByDesc = false
    )
        where T : AggregateRoot<TId>
        where TId : TypedIdValueBase
    {
        return !orderByDesc ? builder.OrderBy(x => x.Id) : builder.OrderByDescending(x => x.Id);
    }

    /// <summary>
    /// Applies creation date ordering to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="orderByDesc">The order by desc.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> ApplyCreateDateOrdering<T>(
        this ISpecificationBuilder<T> builder,
        bool orderByDesc = false
    )
        where T : IAggregateRoot
    {
        return !orderByDesc ? builder.OrderBy(x => x.CreateDate) : builder.OrderByDescending(x => x.CreateDate);
    }

    /// <summary>
    /// Applies paging to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="page">The page.</param>
    /// <param name="pageSize">The page size.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> ApplyPaging<T>(this ISpecificationBuilder<T> builder, int page, int pageSize)
        where T : IAggregateRoot
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 1;
        }

        return builder.Skip((page - 1) * pageSize).Take(pageSize);
    }

    /// <summary>
    /// Applies paging to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <param name="distinctBy">The distinct by.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> DistinctBy<T>(
        this ISpecificationBuilder<T> builder,
        Expression<Func<T, object>> distinctBy
    )
        where T : IAggregateRoot
    {
        builder.Specification.Items.TryAdd(nameof(DistinctBy), distinctBy);
        return builder;
    }

    /// <summary>
    /// Applies paging to the specified <paramref name="builder"/>.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="builder">The builder.</param>
    /// <returns>The <see cref="ISpecificationBuilder{T}"/>.</returns>
    public static ISpecificationBuilder<T> Distinct<T>(this ISpecificationBuilder<T> builder)
        where T : IAggregateRoot
    {
        builder.Specification.Items.TryAdd(nameof(Distinct), true);
        return builder;
    }

    /// <summary>
    /// Formats the text to be used in a LIKE query.
    /// </summary>
    /// <param name="text">The input text to format.</param>
    /// <returns>The formatted text.</returns>
    public static string SpecificationSearch(this string text)
    {
        return $"%{text}%";
    }

    /// <summary>
    /// Applies Sieve processing to the specification builder.
    /// </summary>
    public static ISpecificationBuilder<T> ApplyPaging<T>(this ISpecificationBuilder<T> builder, IPageRequest request)
        where T : class, IAggregateRoot
    {
        return builder.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize);
    }
}
