using System.Globalization;
using System.Reflection;
using BuildingBlocks.Core.Reflection;
using BuildingBlocks.Web.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Provides extension methods for mapping endpoints in a web application.
/// </summary>
public static class EndpointExtensions
{
    /// <summary>
    /// Maps endpoints in a web application.
    /// </summary>
    /// <param name="app">The WebApplication to configure.</param>
    /// <param name="routeGroupBuilder">The route group builder.</param>
    /// <param name="scanAssemblies">The scan assemblies.</param>
    public static void MapMinimalApis(
        this WebApplication app,
        RouteGroupBuilder? routeGroupBuilder = null,
        params Assembly[] scanAssemblies
    )
    {
        var assemblies = scanAssemblies.Length != 0 ? scanAssemblies : AppDomain.CurrentDomain.GetAssemblies();

        var endpoints = ReflectionUtilities.GetAllTypesImplementingInterface<IEndpointDefinition>(assemblies);

        IEndpointRouteBuilder builder = routeGroupBuilder is null ? app : routeGroupBuilder;

        foreach (var endpoint in endpoints)
        {
            var instantiatedType = (IEndpointDefinition)Activator.CreateInstance(endpoint)!;
            instantiatedType.ConfigureEndpoints(builder);
        }
    }

    /// <summary>
    /// Configures the response type and description for an endpoint.
    /// </summary>
    /// <param name="builder">The route handler builder.</param>
    /// <param name="description">The description of the response.</param>
    /// <param name="statusCode">The HTTP status code.</param>
    /// <param name="responseType">The type of the response.</param>
    /// <param name="contentType">The content type of the response.</param>
    /// <param name="additionalContentTypes">Additional content types supported.</param>
    /// <returns>The configured route handler builder.</returns>
    public static RouteHandlerBuilder Produces(
        this RouteHandlerBuilder builder,
        string description,
        int statusCode,
        Type? responseType = null,
        string? contentType = null,
        params string[] additionalContentTypes
    )
    {
        // WithOpenApi should place before versioning and other things - this fixed in Aps.Versioning.Http 7.0.0-preview.1
        builder.WithOpenApi(operation =>
        {
            operation.Responses[statusCode.ToString(CultureInfo.InvariantCulture)].Description = description;

            return operation;
        });

        builder.Produces(
            statusCode,
            responseType,
            contentType: contentType,
            additionalContentTypes: additionalContentTypes
        );

        return builder;
    }

    /// <summary>
    /// Configures the strongly-typed response for an endpoint.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="builder">The route handler builder.</param>
    /// <param name="description">The description of the response.</param>
    /// <param name="statusCode">The HTTP status code.</param>
    /// <param name="contentType">The content type of the response.</param>
    /// <param name="additionalContentTypes">Additional content types supported.</param>
    /// <returns>The configured route handler builder.</returns>
    public static RouteHandlerBuilder Produces<TResponse>(
        this RouteHandlerBuilder builder,
        string description,
        int statusCode,
        string? contentType = null,
        params string[] additionalContentTypes
    )
    {
        builder.WithOpenApi(operation =>
        {
            operation.Responses[statusCode.ToString(CultureInfo.InvariantCulture)].Description = description;

            return operation;
        });

        builder.Produces<TResponse>(
            statusCode,
            contentType: contentType,
            additionalContentTypes: additionalContentTypes
        );

        return builder;
    }

    /// <summary>
    /// Configures the problem details response for an endpoint.
    /// </summary>
    /// <param name="builder">The route handler builder.</param>
    /// <param name="description">The description of the problem.</param>
    /// <param name="statusCode">The HTTP status code.</param>
    /// <param name="contentType">The content type of the response.</param>
    /// <returns>The configured route handler builder.</returns>
    public static RouteHandlerBuilder ProducesProblem(
        this RouteHandlerBuilder builder,
        string description,
        int statusCode,
        string? contentType = null
    )
    {
        builder.WithOpenApi(operation =>
        {
            operation.Responses[statusCode.ToString(CultureInfo.InvariantCulture)].Description = description;

            return operation;
        });

        builder.ProducesProblem(statusCode, contentType: contentType);

        return builder;
    }

    /// <summary>
    /// Configures the validation problem details response for an endpoint.
    /// </summary>
    /// <param name="builder">The route handler builder.</param>
    /// <param name="description">The description of the validation problem.</param>
    /// <param name="statusCode">The HTTP status code (defaults to 400 Bad Request).</param>
    /// <param name="contentType">The content type of the response.</param>
    /// <returns>The configured route handler builder.</returns>
    public static RouteHandlerBuilder ProducesValidationProblem(
        this RouteHandlerBuilder builder,
        string description,
        int statusCode = StatusCodes.Status400BadRequest,
        string? contentType = null
    )
    {
        builder.WithOpenApi(operation =>
        {
            operation.Responses[statusCode.ToString(CultureInfo.InvariantCulture)].Description = description;

            return operation;
        });

        builder.ProducesValidationProblem(statusCode, contentType: contentType);

        return builder;
    }

    /// <summary>
    /// Adds summary and description metadata to an endpoint for OpenAPI documentation.
    /// </summary>
    /// <param name="builder">The route handler builder.</param>
    /// <param name="summary">A brief summary of the endpoint.</param>
    /// <param name="description">A detailed description of the endpoint.</param>
    /// <returns>The configured route handler builder.</returns>
    public static RouteHandlerBuilder WithSummaryAndDescription(
        this RouteHandlerBuilder builder,
        string summary,
        string description
    )
    {
        builder.WithOpenApi(operation =>
        {
            operation.Summary = summary;
            operation.Description = description;
            return operation;
        });

        return builder;
    }
}
