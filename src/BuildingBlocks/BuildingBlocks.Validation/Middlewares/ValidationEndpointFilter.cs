using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using ValidationException = BuildingBlocks.Validation.Common.ValidationException;

namespace BuildingBlocks.Validation.Middlewares;

/// <summary>
/// Represents a class responsible for validating the request.
/// </summary>
/// <typeparam name="T">The type of the request.</typeparam>
internal sealed class ValidationEndpointFilter<T> : IEndpointFilter
{
    /// <inheritdoc />
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var entityObject = ctx.Arguments.OfType<object>().FirstOrDefault(a => a is T);

        if (entityObject is null)
        {
            throw new InvalidOperationException($"The argument must be of type {typeof(T)}");
        }

        if (entityObject is not T entity)
        {
            throw new InvalidOperationException("The argument could not be cast to the specified type.");
        }

        var validator = ctx.HttpContext.RequestServices.GetService<IValidator<T>>();
        var validationResult = validator is not null
            ? await validator.FluentValidateAsync(entity)
            : ValidationExtensions.DataAnnotationValidate(entity);

        if (!validationResult.IsValid)
        {
            throw new ValidationException(
                validationResult.Errors.Select(e => new ValidationFailure(e.PropertyName, e.ErrorMessage))
            );
        }

        return await next(ctx);
    }
}
