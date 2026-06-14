using BuildingBlocks.Core.ErrorHandling;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace BuildingBlocks.Web.ProblemDetail.Extensions;

/// <summary>
/// Contains extension methods for the appError class.
/// </summary>
public static class ErrorProblemExtensions
{
    private const string StatusUrl = "https://datatracker.ietf.org/doc/html/rfc";
    private const string RFC400 = "7231#section-6.5.1";
    private const string RFC401 = "7235#section-3.1";
    private const string RFC403 = "7231#section-6.5.3";
    private const string RFC404 = "7231#section-6.5.4";
    private const string RFC500 = "7231#section-6.6.1";

    /// <summary>
    /// Converts the appError to a problem details object.
    /// </summary>
    /// <param name="appError">The appError.</param>
    /// <returns>The problem details object.</returns>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails ToProblemDetails(this AppError appError)
    {
        var statusCode = appError.Code;
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Title = appError.Title,
            Status = statusCode,
            Type = statusCode.GetRfcPage(),
            Detail = appError.Message,
        };
    }

    /// <summary>
    /// Creates a problem http result with the specified value.
    /// </summary>
    /// <param name="title">The title.</param>
    /// <param name="status">The status code.</param>
    /// <param name="detail">The detail.</param>
    /// <returns>The problem http result with the specified value.</returns>
    public static ProblemHttpResult CreateProblemHttpResult(string title, int status, string detail)
    {
        return TypedResults.Problem(title: title, statusCode: status, type: status.GetRfcPage(), detail: detail);
    }

    /// <summary>
    /// Provide problem's type appError rfc page.
    /// </summary>
    /// <param name="status">The status code.</param>
    /// <returns>The URL of the RFC page for the specified status code.</returns>
    public static string GetRfcPage(this int status)
    {
        var errorPage = status switch
        {
            StatusCodes.Status400BadRequest => RFC400,
            StatusCodes.Status401Unauthorized => RFC401,
            StatusCodes.Status403Forbidden => RFC403,
            StatusCodes.Status404NotFound => RFC404,
            StatusCodes.Status500InternalServerError => RFC500,
            _ => RFC500,
        };

        return $"{StatusUrl}{errorPage}";
    }
}
