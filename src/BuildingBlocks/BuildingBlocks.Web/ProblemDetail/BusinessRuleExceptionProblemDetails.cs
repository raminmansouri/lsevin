using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a custom ProblemDetails class for handling Business Rule Validation exceptions.
/// </summary>
public sealed class BusinessRuleExceptionProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    /// <summary>
    /// Initializes a new instance of the <see cref="BusinessRuleExceptionProblemDetails"/> class.
    /// </summary>
    public BusinessRuleExceptionProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="BusinessRuleExceptionProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The BusinessRuleValidationException instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public BusinessRuleExceptionProblemDetails(
        BusinessRuleValidationException exception,
        int status = StatusCodes.Status409Conflict
    )
    {
        Title = SharedResource.Business_Rule_Error;
        Status = status;
        Detail = exception.Details;
        Type = status.GetRfcPage();
    }
}
