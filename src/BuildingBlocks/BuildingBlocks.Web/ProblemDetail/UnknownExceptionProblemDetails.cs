using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a custom ProblemDetails class for handling Unknown exceptions.
/// </summary>
public sealed class UnknownExceptionProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    /// <summary>
    /// Initializes a new instance of the <see cref="UnknownExceptionProblemDetails"/> class.
    /// </summary>
    public UnknownExceptionProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="UnknownExceptionProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The Unknown Exception instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public UnknownExceptionProblemDetails(Exception exception, int status = StatusCodes.Status500InternalServerError)
    {
        Title = SharedResource.Unknown_Error;
        Status = status;
        Detail = $"message: {exception.Message}, details: {exception.InnerException?.Message ?? "--"}";
        Type = status.GetRfcPage();
    }
}
