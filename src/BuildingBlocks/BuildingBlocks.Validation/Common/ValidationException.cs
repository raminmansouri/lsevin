using BuildingBlocks.Validation.Models;
using FluentValidation.Results;

namespace BuildingBlocks.Validation.Common;

/// <summary>
/// Represents an exception that occurs when validation fails.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ValidationException"/> class.
/// </remarks>
/// <param name="message">A description of the validation error (optional).</param>
public sealed class ValidationException(string? message = null) : Exception(message)
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ValidationException"/> class with a collection of validation failures.
    /// </summary>
    /// <param name="failures">The collection of validation failures.</param>
    public ValidationException(IEnumerable<ValidationFailure> failures)
        : this()
    {
        Errors.AddRange(failures.Select(f => new ValidationErrorModel(f.PropertyName, f.ErrorMessage)));
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="ValidationException"/> class with a collection of validation failures.
    /// </summary>
    /// <param name="validationResults">The collection of validation failures.</param>
    public ValidationException(IEnumerable<System.ComponentModel.DataAnnotations.ValidationResult> validationResults)
        : this()
    {
        foreach (var validationResult in validationResults)
        {
            foreach (var memberName in validationResult.MemberNames)
            {
                Errors.Add(new ValidationErrorModel(memberName, validationResult.ErrorMessage ?? string.Empty));
            }
        }
    }

    /// <summary>
    /// Gets a dictionary of validation errors where the key is the property name and the value is an array of error messages.
    /// </summary>
    public List<ValidationErrorModel> Errors { get; } = [];
}
