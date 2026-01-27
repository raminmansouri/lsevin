using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Represents a transformer for converting enum types to string types in OpenAPI schemas.
/// </summary>
public class EnumSchemaTransformer : IOpenApiSchemaTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(
        OpenApiSchema schema,
        OpenApiSchemaTransformerContext context,
        CancellationToken cancellationToken
    )
    {
        var enumType = context.JsonTypeInfo.Type;

        if (!enumType.IsEnum)
        {
            return Task.CompletedTask;
        }

        schema.Enum.Clear();
        Enum.GetNames(enumType).ToList().ForEach(name => schema.Enum.Add(new OpenApiString(name)));

        schema.Type = "string";

        return Task.CompletedTask;
    }
}
