using BuildingBlocks.Validation.Middlewares;
using BuildingBlocks.Validation.Models;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Validation.Extensions;

/// <summary>
/// Extension methods for validation.
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// Validates the specified entity using Fluent Validation.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="validator">The validator.</param>
    /// <param name="entity">The entity.</param>
    /// <returns></returns>
    public static async Task<ValidationResultModel> FluentValidateAsync<T>(this IValidator<T> validator, T entity)
    {
        var result = await validator.ValidateAsync(entity).ConfigureAwait(false);
        var validationResult = new ValidationResultModel();
        if (!result.IsValid)
        {
            validationResult.Errors.AddRange(
                result.Errors.Select(e => new ValidationErrorModel(e.PropertyName, e.ErrorMessage))
            );
        }

        return validationResult;
    }

    /// <summary>
    /// Validates the specified entity using Data Annotations.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="entity">The entity.</param>
    /// <returns>The validation result.</returns>
    public static ValidationResultModel DataAnnotationValidate<T>(T entity)
    {
        var validationResult = new ValidationResultModel();
        var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        if (entity is null)
        {
            return validationResult;
        }

        var context = new System.ComponentModel.DataAnnotations.ValidationContext(entity, null, null);
        if (
            !System.ComponentModel.DataAnnotations.Validator.TryValidateObject(entity, context, validationResults, true)
        )
        {
            validationResult.Errors.AddRange(
                validationResults.Select(e => new ValidationErrorModel(
                    e.MemberNames.FirstOrDefault() ?? string.Empty,
                    e.ErrorMessage ?? string.Empty
                ))
            );
        }

        return validationResult;
    }

    /// <summary>
    /// Adds a filter to the endpoint.
    /// </summary>
    /// <param name="builder">The <see cref="RouteHandlerBuilder"/> instance to which the filter will be added.</param>
    /// <typeparam name="T">The type of the filter.</typeparam>
    /// <returns>The <see cref="RouteHandlerBuilder"/> instance.</returns>
    public static RouteHandlerBuilder WithValidation<T>(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter<ValidationEndpointFilter<T>>();
    }
}
