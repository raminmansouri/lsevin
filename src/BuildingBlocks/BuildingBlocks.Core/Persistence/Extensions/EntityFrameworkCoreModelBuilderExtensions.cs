using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Query;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Provides extension methods for configuring Entity Framework Core Model Builder.
/// </summary>
public static class EntityFrameworkCoreModelBuilderExtensions
{
    /// <summary>
    /// Adds a query filter to the specified entity type builder.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="entityTypeBuilder">The entity type builder to which the query filter is added.</param>
    /// <param name="expression">The expression representing the query filter.</param>
    public static void AddQueryFilter<T>(this EntityTypeBuilder entityTypeBuilder, Expression<Func<T, bool>> expression)
    {
        var parameterType = Expression.Parameter(entityTypeBuilder.Metadata.ClrType);

        var expressionFilter = ReplacingExpressionVisitor.Replace(
            expression.Parameters[0],
            parameterType,
            expression.Body
        );

        var currentQueryFilter = entityTypeBuilder.Metadata.GetQueryFilter();
        if (currentQueryFilter != null)
        {
            var currentExpressionFilter = ReplacingExpressionVisitor.Replace(
                currentQueryFilter.Parameters[0],
                parameterType,
                currentQueryFilter.Body
            );

            expressionFilter = Expression.AndAlso(currentExpressionFilter, expressionFilter);
        }

        var lambdaExpression = Expression.Lambda(expressionFilter, parameterType);

        entityTypeBuilder.HasQueryFilter(lambdaExpression);
    }

    /// <summary>
    /// Adds an index to the specified entity type.
    /// </summary>
    /// <param name="modelBuilder">The model builder instance.</param>
    /// <param name="indexNames">The names of the indexes.</param>
    /// <typeparam name="T">The entity type to add the index to.</typeparam>
    /// <returns>The model builder instance with the index added.</returns>
    public static ModelBuilder AddIndex<T>(this ModelBuilder modelBuilder, params string[] indexNames)
    {
        modelBuilder
            .Model.GetEntityTypes()
            .Where(entityType => typeof(T).IsAssignableFrom(entityType.ClrType))
            .ToList()
            .ForEach(entityType => modelBuilder.Entity(entityType.ClrType).HasIndex(indexNames));

        return modelBuilder;
    }
}
