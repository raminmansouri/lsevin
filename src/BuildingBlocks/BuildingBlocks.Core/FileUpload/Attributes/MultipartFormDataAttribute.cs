using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BuildingBlocks.Core.FileUpload.Attributes;

/// <summary>
/// Represents the multipart form data attribute.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="MultipartFormDataAttribute"/> class.
/// </remarks>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class MultipartFormDataAttribute : ActionFilterAttribute
{
    /// <inheritdoc />
    public override void OnActionExecuted(ActionExecutedContext context)
    {
        var request = context.HttpContext.Request;

        if (
            request.HasFormContentType
            && (request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) ?? false)
        )
        {
            return;
        }

        context.Result = new StatusCodeResult(StatusCodes.Status415UnsupportedMediaType);
    }
}
