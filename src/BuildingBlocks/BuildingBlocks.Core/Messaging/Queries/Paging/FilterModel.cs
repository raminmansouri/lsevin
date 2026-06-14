namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents a filter model.
/// </summary>
/// <param name="FieldName">The field name.</param>
/// <param name="Comparision">The comparision.</param>
/// <param name="FieldValue">The field value.</param>
public sealed record FilterModel(string FieldName, FilterComparison Comparision, string FieldValue);

/// <summary>
/// Represents the filter comparison.
/// </summary>
public enum FilterComparison
{
    Equals,
    NotEquals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Contains,
    NotContains,
    StartsWith,
    EndsWith,
    IsNull,
    IsNotNull,
    In,
    NotIn,
}
