using BuildingBlocks.Web.Constants;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Adds security schemes to the OpenAPI document.
/// </summary>
public class SecuritySchemeDocumentTransformer : IOpenApiDocumentTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken
    )
    {
        document.Components ??= new();

        var schema = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Name = "Authorization",
            Scheme = JwtBearerDefaults.AuthenticationScheme,
            BearerFormat = WebConstants.OpenApi.AuthorizationFormat,
            In = ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme.",
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = JwtBearerDefaults.AuthenticationScheme,
            },
        };

        document.Components.SecuritySchemes.Add(JwtBearerDefaults.AuthenticationScheme, schema);
        return Task.CompletedTask;
    }
}
