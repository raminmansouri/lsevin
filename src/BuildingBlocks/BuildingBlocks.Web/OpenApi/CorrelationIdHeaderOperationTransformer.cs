using BuildingBlocks.Core.Web.Constants;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Represents a transformer for adding the Correlation ID header to OpenAPI operations.
/// </summary>
public class CorrelationIdHeaderOperationTransformer : IOpenApiOperationTransformer
{
    private const string CorrelationIdHeaderName = RequestHeaderConstValues.CorrelationId;

    /// <inheritdoc />
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken
    )
    {
        operation.Parameters ??= [];

        operation.Parameters.Add(
            new OpenApiParameter
            {
                Name = CorrelationIdHeaderName,
                In = ParameterLocation.Header,
                Description = "Correlation ID for tracking requests across systems",
                Required = false,
                Schema = new OpenApiSchema
                {
                    Type = "string",
                    Example = new OpenApiString("123e4567-e89b-12d3-a456-426614174000"),
                },
            }
        );

        return Task.CompletedTask;
    }
}
