using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Grpc.Core;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.ProblemDetail;

/// <summary>
/// Represents a gRPC ProblemDetails class for handling App exceptions.
/// </summary>
public sealed class RpcExceptionProblemDetails : Microsoft.AspNetCore.Mvc.ProblemDetails
{
    /// <summary>
    /// Initializes a new instance of the <see cref="RpcExceptionProblemDetails"/> class.
    /// </summary>
    public RpcExceptionProblemDetails() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="RpcExceptionProblemDetails"/> class.
    /// </summary>
    /// <param name="exception">The RpcException instance that triggered this problem details.</param>
    /// <param name="status">The status code.</param>
    public RpcExceptionProblemDetails(RpcException exception, int status = StatusCodes.Status400BadRequest)
    {
        Title = SharedResource.Application_Error;
        Status = FindStatusCode(exception.Status.StatusCode) ?? status;
        Detail = exception.Status.Detail;
        Type = (FindStatusCode(exception.Status.StatusCode) ?? status).GetRfcPage();
    }

    /// <summary>
    /// Finds the status code of the RpcException.
    /// </summary>
    /// <param name="statusCode">The status code of the RpcException.</param>
    /// <returns>The status code.</returns>
    private static int? FindStatusCode(StatusCode statusCode)
    {
        return statusCode switch
        {
            StatusCode.PermissionDenied => StatusCodes.Status403Forbidden,
            StatusCode.NotFound => StatusCodes.Status404NotFound,
            StatusCode.Internal => StatusCodes.Status400BadRequest,
            _ => null,
        };
    }
}
