namespace BuildingBlocks.Validation.Models;

/// <summary>
/// Represents a validation error.
/// </summary>
/// <param name="PropertyName"> Gets or sets the name of the property. </param>
/// <param name="ErrorMessage"> Gets or sets the error message. </param>
public sealed record ValidationErrorModel(string PropertyName, string ErrorMessage);
