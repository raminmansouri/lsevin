using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Exceptions;

/// <summary>
/// Represents a custom exception for handling HTTP response errors.
/// </summary>
public class HttpResponseException : CustomException
{
    /// <summary>
    /// Gets the HTTP status code.
    /// </summary>
    public string? ResponseContent { get; }

    /// <summary>
    /// Gets the HTTP headers.
    /// </summary>
    public IReadOnlyDictionary<string, IEnumerable<string>>? Headers { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpResponseException"/> class.
    /// </summary>
    /// <param name="responseContent">The response content.</param>
    /// <param name="statusCode">The status code.</param>
    /// <param name="headers">The HTTP headers.</param>
    /// <param name="inner">The inner exception.</param>
    public HttpResponseException(
        string responseContent,
        int statusCode = StatusCodes.Status500InternalServerError,
        IReadOnlyDictionary<string, IEnumerable<string>>? headers = null,
        Exception? inner = null
    )
        : base(responseContent, statusCode, inner)
    {
        StatusCode = statusCode;
        ResponseContent = responseContent;
        Headers = headers;
    }

    /// <inheritdoc />
    public override string ToString()
    {
        return $"HTTP Response: \n\n{ResponseContent}\n\n{base.ToString()}";
    }
}
