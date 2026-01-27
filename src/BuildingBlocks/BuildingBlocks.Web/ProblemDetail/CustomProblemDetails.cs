using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a custom ProblemDetails class for handling Forbidden Validation exceptions.
/// </summary>
public sealed class CustomProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CustomProblemDetails"/> class.
    /// </summary>
    public CustomProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="CustomProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The CustomException instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public CustomProblemDetails(CustomException exception, int status = StatusCodes.Status400BadRequest)
    {
        Title = SharedResource.Access_Denied_Error;
        Status = status;
        Detail = exception.Message;
        Type = status.GetRfcPage();
    }
}
