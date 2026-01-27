using System.Collections.Specialized;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Web;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Web.Constants;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Provides extension methods for <see cref="HttpClient"/> and <see cref="HttpResponseMessage"/> to handle JSON operations.
/// </summary>
public static class HttpClientExtensions
{
    /// <summary>
    /// Reads the content of the specified <see cref="HttpResponseMessage"/> as a deserialized object of type <typeparamref name="T"/>.
    /// </summary>
    /// <typeparam name="T">The type of the object to deserialize to.</typeparam>
    /// <param name="response">The <see cref="HttpResponseMessage"/> to read the content from.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A <see cref="Task{TResult}"/> that represents the asynchronous read and deserialize operation.</returns>
    public static async Task<T?> ReadContentAsAsync<T>(
        this HttpResponseMessage response,
        CancellationToken cancellationToken
    )
    {
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpResponseException(response.ReasonPhrase ?? string.Empty, (int)response.StatusCode);
        }

        var dataAsString = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        return JsonSerializer.Deserialize<T>(dataAsString, JsonSerializationSettings.DefaultJsonSerializerOptions);
    }

    /// <summary>
    /// Sends a POST request to the specified URL as a JSON content.
    /// </summary>
    /// <typeparam name="T">The type of the object to serialize to JSON.</typeparam>
    /// <param name="httpClient">The <see cref="HttpClient"/> to send the request with.</param>
    /// <param name="url">The URL to send the request to.</param>
    /// <param name="data">The object to serialize to JSON and send in the request content.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A <see cref="Task{HttpResponseMessage}"/> that represents the asynchronous send operation.</returns>
    public static Task<HttpResponseMessage> PostAsJsonAsync<T>(
        this HttpClient httpClient,
        string url,
        T data,
        CancellationToken cancellationToken
    )
    {
        var dataAsString = JsonSerializer.Serialize(data);
        var content = new StringContent(dataAsString);

        content.Headers.ContentType = new MediaTypeHeaderValue(RequestHeaderConstValues.ApplicationJsonContent);

        return httpClient.PostAsync(url, content, cancellationToken);
    }

    /// <summary>
    /// Sends a PUT request to the specified URL as a JSON content.
    /// </summary>
    /// <typeparam name="T">The type of the object to serialize to JSON.</typeparam>
    /// <param name="httpClient">The <see cref="HttpClient"/> to send the request with.</param>
    /// <param name="url">The URL to send the request to.</param>
    /// <param name="data">The object to serialize to JSON and send in the request content.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A <see cref="Task{HttpResponseMessage}"/> that represents the asynchronous send operation.</returns>
    public static Task<HttpResponseMessage> PutAsJsonAsync<T>(
        this HttpClient httpClient,
        string url,
        T data,
        CancellationToken cancellationToken
    )
    {
        var dataAsString = JsonSerializer.Serialize(data);
        var content = new StringContent(dataAsString);

        content.Headers.ContentType = new MediaTypeHeaderValue(RequestHeaderConstValues.ApplicationJsonContent);

        return httpClient.PutAsync(url, content, cancellationToken);
    }

    public static async Task EnsureSuccessStatusCodeWithDetailAsync(this HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        throw new HttpResponseException(content, (int)response.StatusCode);
    }

    /// <summary>
    /// Builds a URL with query parameters.
    /// </summary>
    /// <param name="url">The URL.</param>
    /// <param name="queryParams">The query parameters.</param>
    /// <param name="ignoredProperties">The ignored properties.</param>
    /// <returns>The URL with query parameters.</returns>
    public static string BuildUrlWithQueryParams(string url, object queryParams, IList<string> ignoredProperties)
    {
        // Create an empty NameValueCollection
        var query = HttpUtility.ParseQueryString(string.Empty);

        // Populate the collection from queryParams
        var properties = queryParams.GetType().GetProperties();

        foreach (var property in properties)
        {
            if (ignoredProperties?.Contains(property.Name, StringComparer.OrdinalIgnoreCase) == true)
            {
                continue;
            }

            var value = property.GetValue(queryParams);

            if (value != null)
            {
                query[property.Name] = value.ToString();
            }
        }

        // Manually build the query string
        var queryStr = BuildQueryString(query);

        // If there's nothing to append, just return the original URL
        return string.IsNullOrEmpty(queryStr) ? url : $"{url}?{queryStr}";
    }

    /// <summary>
    /// Adds query parameters to the specified URL.
    /// </summary>
    /// <param name="url">The URL to add the query parameters to.</param>
    /// <param name="queryParams">The query parameters.</param>
    /// <returns>The URL with the query parameters added.</returns>
    public static string WithQueryParams(this string url, object queryParams)
    {
        var properties = queryParams.GetType().GetProperties();

        var queryParts = properties
            .Where(p => p.GetValue(queryParams, index: null) is not null)
            .Select(p => $"{p.Name}={p.GetValue(queryParams, index: null)}");

        var queryString = string.Join('&', queryParts);

        if (string.IsNullOrEmpty(queryString))
        {
            return url;
        }

        return url.Contains('?', StringComparison.Ordinal) ? $"{url}&{queryString}" : $"{url}?{queryString}";
    }

    /// <summary>
    /// Adds query parameters to the specified URL.
    /// </summary>
    /// <param name="query">The query parameters.</param>
    /// <returns>The URL with the query parameters added.</returns>
    private static string BuildQueryString(NameValueCollection? query)
    {
        if (query is null || query.Count == 0)
        {
            return string.Empty;
        }

        var sb = new StringBuilder();

        foreach (var key in query.AllKeys)
        {
            var encodedKey = HttpUtility.UrlEncode(key);
            var encodedValue = HttpUtility.UrlEncode(query[key]);
            sb.Append($"{encodedKey}={encodedValue}&");
        }

        if (sb.Length > 0)
        {
            sb.Length--;
        }

        return sb.ToString();
    }
}
