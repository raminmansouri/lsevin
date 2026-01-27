using Ardalis.Specification.EntityFrameworkCore;

namespace BuildingBlocks.Core.Persistence.Specification;

/// <summary>
/// Represents the base class for all specifications.
/// </summary>
public sealed class SpecificationBaseEvaluator : SpecificationEvaluator
{
    /// <summary>
    /// Gets the singleton instance of the <see cref="SpecificationBaseEvaluator"/> class.
    /// </summary>
    /// <returns>The singleton instance of the <see cref="SpecificationBaseEvaluator"/> class.</returns>
    public static SpecificationBaseEvaluator Instance { get; } = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="SpecificationBaseEvaluator"/> class.
    /// </summary>
    /// <returns>The singleton instance of the <see cref="SpecificationBaseEvaluator"/> class.</returns>
    public SpecificationBaseEvaluator()
    {
        Evaluators.Add(DistinctEvaluator.Instance);
    }
}
