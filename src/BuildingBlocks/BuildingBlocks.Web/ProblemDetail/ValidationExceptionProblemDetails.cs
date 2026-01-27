using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a custom ProblemDetails class for handling Validation exceptions.
/// </summary>
public sealed class ValidationExceptionProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    private const string ErrorsKey = "errors";

    /// <summary>
    /// Initializes a new instance of the <see cref="ValidationExceptionProblemDetails"/> class.
    /// </summary>
    public ValidationExceptionProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="ValidationExceptionProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The ValidationException instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public ValidationExceptionProblemDetails(
        ValidationException exception,
        int status = StatusCodes.Status400BadRequest
    )
    {
        Title = SharedResource.Validation_Error;
        Status = status;
        Detail = exception.Message;
        Type = status.GetRfcPage();
        Extensions[ErrorsKey] = exception
            .Errors.GroupBy(e => e.PropertyName, StringComparer.Ordinal)
            .ToDictionary(
                group => group.Key,
                group => group.Select(e => e.ErrorMessage).ToArray(),
                StringComparer.Ordinal
            );
    }
}
