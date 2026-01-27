using System.Reflection;
using Asp.Versioning;
using BuildingBlocks.Web.Constants;
using BuildingBlocks.Web.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BuildingBlocks.Web.Middlewares;

/// <summary>
/// Middleware for adding endpoint routing.
/// </summary>
public static class EndPointRouterMiddlewareExtensions
{
    /// <summary>
    /// Sets up routing for endpoints.
    /// </summary>
    /// <param name="app">The endpoint route builder to config.</param>
    public static void UseBaseEndPointServices(this IEndpointRouteBuilder app)
    {
        app.MapGet(
                WebConstants.OpenApi.HomeRoute,
                () => Results.Redirect($"{WebConstants.OpenApi.ScalarRoute}/{WebConstants.OpenApi.DefaultVersion}")
            )
            .ExcludeFromDescription();
    }

    /// <summary>
    /// Map minimal api endpoints.
    /// </summary>
    /// <param name="app">The WebApplication to configure.</param>
    /// <param name="scanAssemblies">The scan assemblies.</param>
    public static void UseVersionedMinimalApis(this WebApplication app, params Assembly[] scanAssemblies)
    {
        var apiVersionSet = app.NewApiVersionSet()
            .HasApiVersion(new ApiVersion(WebConstants.Route.ApiMajorVersion, WebConstants.Route.ApiMinorVersion))
            .ReportApiVersions()
            .Build();

        var versionedGroup = app.MapGroup($"{WebConstants.Route.ApiPrefix}/{WebConstants.Route.ApiVersionPattern}")
            .WithApiVersionSet(apiVersionSet);

        app.MapMinimalApis(versionedGroup, scanAssemblies);
    }
}
