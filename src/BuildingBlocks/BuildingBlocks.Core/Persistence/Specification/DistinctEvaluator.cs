using System.Linq.Expressions;
using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;

namespace BuildingBlocks.Core.Persistence.Specification;

/// <summary>
/// Represents the evaluator for the <see cref="SpecificationBase{T,TId}"/> class.
/// </summary>
internal sealed class DistinctEvaluator : IEvaluator
{
    /// <summary>
    /// Initializes a new instance of the <see cref="DistinctEvaluator"/> class.
    /// </summary>
    private DistinctEvaluator() { }

    /// <summary>
    /// Gets the instance of the <see cref="DistinctEvaluator"/> class.
    /// </summary>
    /// <returns>The instance of the <see cref="DistinctEvaluator"/> class.</returns>
    public static DistinctEvaluator Instance { get; } = new DistinctEvaluator();

    /// <inheritdoc />
    public bool IsCriteriaEvaluator { get; } = true;

    /// <inheritdoc />
    public IQueryable<T> GetQuery<T>(IQueryable<T> query, ISpecification<T> specification)
        where T : class
    {
        if (specification.Items.TryGetValue(nameof(BaseSpecificationExtensions.DistinctBy), out var distinctBy))
        {
            var distinctByExpression = (Expression<Func<T, object>>)distinctBy;
            query = query.DistinctBy(distinctByExpression);
        }
        else if (specification.Items.TryGetValue(nameof(BaseSpecificationExtensions.Distinct), out _))
        {
            query = query.Distinct();
        }

        return query;
    }
}
