using Microsoft.AspNetCore.Routing;

namespace BuildingBlocks.Web.Endpoints;

/// <summary>
/// Represents a class responsible for defining HTTP endpoints in a web application.
/// </summary>
public interface IEndpointDefinition
{
    /// <summary>
    /// Defines HTTP endpoints in a web application.
    /// </summary>
    /// <param name="app">The <see cref="IEndpointRouteBuilder"/> instance to which endpoints will be mapped.</param>
    public void ConfigureEndpoints(IEndpointRouteBuilder app);
}
