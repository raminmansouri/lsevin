using System.Collections;
using System.Globalization;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Represents a transformer for adding default values to OpenAPI operations.
/// </summary>
public class OpenApiDefaultValuesOperationTransformer : IOpenApiOperationTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(
        OpenApiOperation openApiOperation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken
    )
    {
        var apiDescription = context.Description;

        openApiOperation.Deprecated |= apiDescription.IsDeprecated();

        foreach (var responseType in context.Description.SupportedResponseTypes)
        {
            var responseKey = responseType.IsDefaultResponse
                ? "default"
                : responseType.StatusCode.ToString(CultureInfo.InvariantCulture);
            var response = openApiOperation.Responses[responseKey];

            foreach (
                var contentType in response
                    .Content.Keys.ToList()
                    .Where(contentType =>
                        responseType.ApiResponseFormats.All(x =>
                            !string.Equals(x.MediaType, contentType, StringComparison.Ordinal)
                        )
                    )
            )
            {
                response.Content.Remove(contentType);
            }
        }

        if (openApiOperation.Parameters == null)
        {
            return Task.CompletedTask;
        }

        foreach (var parameter in openApiOperation.Parameters)
        {
            var description = apiDescription.ParameterDescriptions.FirstOrDefault(p =>
                string.Equals(p.Name, parameter.Name, StringComparison.Ordinal)
            );
            if (description == null)
            {
                continue;
            }

            parameter.Description ??= description.ModelMetadata.Description;

            if (
                parameter.Schema.Default == null
                && description.DefaultValue != null
                && description.DefaultValue is not DBNull
            )
            {
                parameter.Schema.Default = CreateOpenApiAny(description.DefaultValue);
            }

            parameter.Required |= description.IsRequired;
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Creates an OpenAPI Any object from the specified value.
    /// </summary>
    /// <param name="value">The value to convert.</param>
    /// <returns>The OpenAPI Any object.</returns>
    private static IOpenApiAny? CreateOpenApiAny(object? value)
    {
        return value switch
        {
            null => null,
            bool boolValue => new OpenApiBoolean(boolValue),
            byte byteValue => new OpenApiByte(byteValue),
            short shortValue => new OpenApiInteger(shortValue),
            int intValue => new OpenApiInteger(intValue),
            long longValue => new OpenApiLong(longValue),
            float floatValue => new OpenApiFloat(floatValue),
            double doubleValue => new OpenApiDouble(doubleValue),
            decimal decimalValue => new OpenApiDouble((double)decimalValue),
            string stringValue => new OpenApiString(stringValue),
            DateTime dateTimeValue => new OpenApiString(
                dateTimeValue.ToString("yyyy-MM-ddTHH:mm:ss.fffffffK", CultureInfo.InvariantCulture)
            ),
            DateTimeOffset dateTimeOffsetValue => new OpenApiString(
                dateTimeOffsetValue.ToString("yyyy-MM-ddTHH:mm:ss.fffffffzzz", CultureInfo.InvariantCulture)
            ),
            Guid guidValue => new OpenApiString(guidValue.ToString()),
            TimeSpan timeSpanValue => new OpenApiString(timeSpanValue.ToString()),
            Uri uriValue => new OpenApiString(uriValue.ToString()),
            Enum enumValue => new OpenApiString(enumValue.ToString()),
            IList listValue => CreateOpenApiArray(listValue),
            IDictionary dictValue => CreateOpenApiObject(dictValue),
            _ => new OpenApiString(value.ToString()),
        };
    }

    /// <summary>
    /// Creates an OpenAPI array from the specified list.
    /// </summary>
    /// <param name="list">The list to convert.</param>
    /// <returns>The OpenAPI array.</returns>
    private static OpenApiArray CreateOpenApiArray(IList list)
    {
        var array = new OpenApiArray();
        IEnumerable<object?> keys = from object? item in list select CreateOpenApiAny(item);
        array.AddRange(keys.OfType<IOpenApiAny>());

        return array;
    }

    private static OpenApiObject CreateOpenApiObject(IDictionary dict)
    {
        var obj = new OpenApiObject();
        foreach (DictionaryEntry entry in dict)
        {
            var key = entry.Key.ToString();
            var value = CreateOpenApiAny(entry.Value);
            if (key is not null && value is not null)
            {
                obj.Add(key, value);
            }
        }

        return obj;
    }
}
