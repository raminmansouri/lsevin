using BuildingBlocks.Core.Types;
using BuildingBlocks.Validation.Extensions;
using BuildingBlocks.Validation.Models;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.Extensions.Logging;
using ValidationException = BuildingBlocks.Validation.Common.ValidationException;

namespace BuildingBlocks.Validation.Middlewares;

/// <summary>
/// Behavior for validating requests with Fluent Validation or Data Annotations in the MediatR pipeline.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="ValidationBehavior{TRequest,TResponse}"/> class.
/// </remarks>
/// <param name="validators">The validators.</param>
/// <param name="logger">The logger.</param>
public sealed class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators,
    ILogger<ValidationBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : notnull
{
    /// <inheritdoc />
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var typeName = request.GetGenericTypeName();
        var validationResult = new ValidationResultModel();

        if (validators.Any())
        {
            logger.LogInformation("[Validating] - Using Fluent Validation for {CommandType}", typeName);
            foreach (var validator in validators)
            {
                var result = await validator.FluentValidateAsync(request);
                validationResult.Errors.AddRange(result.Errors);
            }
        }

        if (!validationResult.IsValid)
        {
            throw new ValidationException(
                validationResult.Errors.Select(e => new ValidationFailure(e.PropertyName, e.ErrorMessage))
            );
        }

        return await next(cancellationToken);
    }
}
