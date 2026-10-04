using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Web.ProblemDetail;
using Grpc.Core;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ValidationException = BuildingBlocks.Validation.Common.ValidationException;

namespace BuildingBlocks.Web.Middlewares;

/// <summary>
/// Handles exceptions in web requests by providing standardized API responses.
/// </summary>
/// <param name="problemDetailsService">The problem details service.</param>
/// <param name="logger">The logger.</param>
public sealed class ExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<ExceptionHandler> logger)
    : IExceptionHandler
{
    /// <inheritdoc />
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        (ProblemDetails ProblemDetails, int Status) details = exception switch
        {
            BusinessRuleValidationException ruleException => (
                new BusinessRuleExceptionProblemDetails(ruleException),
                StatusCodes.Status409Conflict
            ),
            CustomException customException => (
                new CustomProblemDetails(customException),
                StatusCodes.Status400BadRequest
            ),
            ValidationException validationException => (
                new ValidationExceptionProblemDetails(validationException),
                StatusCodes.Status400BadRequest
            ),
            LSevinException lSevinException => (
                new LSevinProblemDetails(lSevinException),
                StatusCodes.Status400BadRequest
            ),
            RpcException rpcException => (
                new RpcExceptionProblemDetails(rpcException),
                StatusCodes.Status400BadRequest
            ),
            _ => (new UnknownExceptionProblemDetails(exception), StatusCodes.Status500InternalServerError),
        };

        logger.LogError(exception, "[Global AppError Handler] - {Problem}", details.ProblemDetails);

        httpContext.Response.StatusCode = details.Status;
        await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = details.ProblemDetails,
            }
        );
        return true;
    }
}
