using System.Linq.Expressions;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace BuildingBlocks.Core.Linq;

/// <summary>
/// Represents the predicate builder.
/// </summary>
public static class PredicateBuilder
{
    /// <summary>
    /// Builds the predicate.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="propertyName">Name of the property.</param>
    /// <param name="comparison">The comparison operator.</param>
    /// <param name="value">The value.</param>
    /// <returns>The predicate.</returns>
    public static Expression<Func<T, bool>> Build<T>(string propertyName, FilterComparison comparison, string value)
    {
        const string parameterName = "x";
        var parameter = Expression.Parameter(typeof(T), parameterName);
        var left = propertyName.Split('.').Aggregate((Expression)parameter, Expression.Property);
        var body = MakeComparison(left, comparison, value);
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }

    /// <summary>
    /// Ands the specified expressions.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="a">The first expression.</param>
    /// <param name="b">The second expression.</param>
    /// <returns>The result of the and operation.</returns>
    public static Expression<Func<T, bool>> And<T>(this Expression<Func<T, bool>> a, Expression<Func<T, bool>> b)
    {
        var p = a.Parameters[0];

        var visitor = new SubstExpressionVisitor { Subst = { [b.Parameters[0]] = p } };

        Expression body = Expression.And(a.Body, visitor.Visit(b.Body));
        return Expression.Lambda<Func<T, bool>>(body, p);
    }

    /// <summary>
    /// Ors the specified expressions.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="a">The first expression.</param>
    /// <param name="b">The second expression.</param>
    /// <returns>The result of the or operation.</returns>
    public static Expression<Func<T, bool>> Or<T>(this Expression<Func<T, bool>> a, Expression<Func<T, bool>> b)
    {
        var p = a.Parameters[0];

        var visitor = new SubstExpressionVisitor { Subst = { [b.Parameters[0]] = p } };

        Expression body = Expression.Or(a.Body, visitor.Visit(b.Body));
        return Expression.Lambda<Func<T, bool>>(body, p);
    }

    /// <summary>
    /// Makes the comparison.
    /// </summary>
    /// <param name="left">The left.</param>
    /// <param name="comparison">The comparison.</param>
    /// <param name="value">The value.</param>
    /// <returns>The result of the comparison.</returns>
    private static Expression MakeComparison(Expression left, FilterComparison comparison, string value)
    {
        return comparison switch
        {
            FilterComparison.Equals => MakeBinary(ExpressionType.Equal, left, value),
            FilterComparison.NotEquals => MakeBinary(ExpressionType.NotEqual, left, value),
            FilterComparison.GreaterThan => MakeBinary(ExpressionType.GreaterThan, left, value),
            FilterComparison.GreaterThanOrEqual => MakeBinary(ExpressionType.GreaterThanOrEqual, left, value),
            FilterComparison.LessThan => MakeBinary(ExpressionType.LessThan, left, value),
            FilterComparison.LessThanOrEqual => MakeBinary(ExpressionType.LessThanOrEqual, left, value),
            FilterComparison.Contains => Expression.Call(
                MakeString(left),
                "Contains",
                Type.EmptyTypes,
                Expression.Constant(value, typeof(string))
            ),
            FilterComparison.StartsWith => Expression.Call(
                MakeString(left),
                "StartsWith",
                Type.EmptyTypes,
                Expression.Constant(value, typeof(string))
            ),
            FilterComparison.EndsWith => Expression.Call(
                MakeString(left),
                "EndsWith",
                Type.EmptyTypes,
                Expression.Constant(value, typeof(string))
            ),
            FilterComparison.In => MakeList(left, value.Split(',')),
            FilterComparison.NotIn => Expression.Not(MakeList(left, value.Split(','))),
            FilterComparison.IsNull => MakeBinary(ExpressionType.Equal, left, null),
            FilterComparison.IsNotNull => MakeBinary(ExpressionType.NotEqual, left, null),
            _ => throw new NotSupportedException($"Invalid comparison operator '{comparison}'."),
        };
    }

    /// <summary>
    /// Makes the list.
    /// </summary>
    /// <param name="left">The left.</param>
    /// <param name="codes">The codes.</param>
    /// <returns>The result of the list.</returns>
    private static Expression MakeList(Expression left, IEnumerable<string> codes)
    {
        var objValues = codes.Cast<object>().ToList();
        var type = typeof(List<object>);
        var methodInfo = type.GetMethod("Contains", [typeof(object)]);
        Guard.Against.Null(methodInfo, nameof(methodInfo));
        var list = Expression.Constant(objValues);
        var body = Expression.Call(list, methodInfo, left);
        return body;
    }

    /// <summary>
    /// Makes the string.
    /// </summary>
    /// <param name="source">The source.</param>
    /// <returns>The result of the string.</returns>
    private static Expression MakeString(Expression source)
    {
        return source.Type == typeof(string) ? source : Expression.Call(source, "ToString", Type.EmptyTypes);
    }

    /// <summary>
    /// Makes the binary.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="left">The left.</param>
    /// <param name="value">The value.</param>
    /// <returns>The result of the binary.</returns>
    private static Expression MakeBinary(ExpressionType type, Expression left, string? value)
    {
        object? typedValue = value;

        if (left.Type != typeof(string))
        {
            if (string.IsNullOrEmpty(value))
            {
                typedValue = null;

                if (Nullable.GetUnderlyingType(left.Type) == null)
                    left = Expression.Convert(left, typeof(Nullable<>).MakeGenericType(left.Type));
            }
            else
            {
                var valueType = Nullable.GetUnderlyingType(left.Type) ?? left.Type;

                typedValue =
                    valueType.IsEnum ? Enum.Parse(valueType, value)
                    : valueType == typeof(Guid) ? Guid.Parse(value)
                    : Convert.ChangeType(value, valueType);
            }
        }

        var right = Expression.Constant(typedValue, left.Type);
        return Expression.MakeBinary(type, left, right);
    }

    /// <summary>
    /// Represents the expression visitor.
    /// </summary>
    private sealed class SubstExpressionVisitor : ExpressionVisitor
    {
        public readonly Dictionary<Expression, Expression> Subst = new();

        protected override Expression VisitParameter(ParameterExpression node)
        {
            return Subst.TryGetValue(node, out var newValue) ? newValue : node;
        }
    }
}
