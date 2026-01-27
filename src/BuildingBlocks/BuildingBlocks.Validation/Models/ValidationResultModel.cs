namespace BuildingBlocks.Validation.Models;

/// <summary>
/// Represents a validation error.
/// </summary>
public sealed record ValidationResultModel
{
    /// <summary>
    /// Gets a value indicating whether the validation was successful.
    /// </summary>
    public bool IsValid => Errors.Count == 0;

    /// <summary>
    /// Gets or sets the list of validation errors.
    /// </summary>
    public List<ValidationErrorModel> Errors { get; set; } = [];
}
