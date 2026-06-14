using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace BuildingBlocks.Web.Endpoints;

/// <summary>
/// An abstract class that provides methods for handling HTTP response results in endpoints.
/// </summary>
public abstract class EndpointResponseHandler
{
    /// <summary>
    /// Creates a success result with the specified value.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="value">The value.</param>
    /// <returns>The success ok result with the specified value.</returns>
    protected static Ok<T> EndpointSucceedOk<T>(T? value)
    {
        return TypedResults.Ok(value);
    }

    /// <summary>
    /// Creates a success result with the specified value.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="uri">The uri of the created resource.</param>
    /// <param name="value">The value.</param>
    /// <returns>The success created result with the specified value.</returns>
    protected static Created<T> EndpointSucceedCreated<T>(string uri, T? value)
    {
        return TypedResults.Created(uri, value);
    }

    /// <summary>
    /// Creates a success result with the specified value.
    /// </summary>
    /// <param name="value">The value.</param>
    /// <param name="routeName">The route name.</param>
    /// <param name="routeValues">The route values.</param>
    /// <returns>The created at route result with the specified value.</returns>
    protected static CreatedAtRoute<T> EndpointSucceedCreatedAtRoute<T>(
        T? value,
        string routeName,
        object? routeValues = null
    )
    {
        return TypedResults.CreatedAtRoute(value, routeName, routeValues);
    }

    /// <summary>
    /// Creates a success result with the specified value.
    /// </summary>
    /// <param name="errors">The errors.</param>
    /// <returns>The problem result based on specified errors.</returns>
    protected static ProblemHttpResult EndpointFailed(IReadOnlyCollection<AppError>? errors)
    {
        var error = errors?.FirstOrDefault() ?? AppError.ApplicationErrorMessage(SharedResource.Application_Error);
        return ErrorProblemExtensions.CreateProblemHttpResult(
            title: error.Title,
            status: error.Code,
            detail: error.Message
        );
    }

    /// <summary>
    /// Creates a success result with the specified value.
    /// </summary>
    /// <param name="error">The error.</param>
    /// <returns>The problem result based on specified error.</returns>
    protected static ProblemHttpResult EndpointFailed(AppError? error)
    {
        var errorObject = error ?? AppError.ApplicationErrorMessage(string.Empty);
        return ErrorProblemExtensions.CreateProblemHttpResult(
            title: errorObject.Title,
            status: errorObject.Code,
            detail: errorObject.Message
        );
    }
}
