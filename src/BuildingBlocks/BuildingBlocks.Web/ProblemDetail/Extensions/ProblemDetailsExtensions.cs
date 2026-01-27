using BuildingBlocks.Core.Web.Constants;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BuildingBlocks.Web.ProblemDetail.Extensions;

/// <summary>
/// Extensions for <see cref="ProblemDetails"/>.
/// </summary>
public static class ProblemDetailsExtensions
{
    /// <summary>
    /// Customizes the problem details.
    /// </summary>
    /// <param name="context">The problem details context.</param>
    public static void Customize(this ProblemDetailsContext context)
    {
        context.ProblemDetails.Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
        context.ProblemDetails.Extensions.TryAdd(
            RequestHeaderConstValues.RequestId,
            context.HttpContext.TraceIdentifier
        );
    }
}
