using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a custom ProblemDetails class for handling App exceptions.
/// </summary>
public sealed class LSevinProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    /// <summary>
    /// Initializes a new instance of the <see cref="LSevinProblemDetails"/> class.
    /// </summary>
    public LSevinProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="LSevinProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The CustomAppException instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public LSevinProblemDetails(LSevinException exception, int status = StatusCodes.Status400BadRequest)
    {
        Title = SharedResource.Application_Error;
        Status = status;
        Detail = exception.Message;
        Type = status.GetRfcPage();
    }
}
