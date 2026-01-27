using System.Linq.Expressions;

namespace BuildingBlocks.Core.Linq;

/// <summary>
/// Expression visitor for replacing a parameter with a new parameter in an expression tree.
/// </summary>
public sealed class ParameterReplacerExpressionVisitor : ExpressionVisitor
{
    private readonly ParameterExpression _oldParameter;
    private readonly ParameterExpression _newParameter;

    /// <summary>
    /// Initializes a new instance of the <see cref="ParameterReplacerExpressionVisitor"/> class.
    /// </summary>
    /// <param name="oldParameter">The old parameter to be replaced.</param>
    /// <param name="newParameter">The new parameter to replace the old parameter.</param>
    public ParameterReplacerExpressionVisitor(ParameterExpression oldParameter, ParameterExpression newParameter)
    {
        _oldParameter = oldParameter;
        _newParameter = newParameter;
    }

    /// <inheritdoc />
    protected override Expression VisitParameter(ParameterExpression node)
    {
        return node == _oldParameter ? _newParameter : base.VisitParameter(node);
    }
}
