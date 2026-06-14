namespace BuildingBlocks.Core.Web.Constants;

/// <summary>
/// Represents the request header constants.
/// </summary>
public static class RequestHeaderConstValues
{
    /// <summary>
    /// Represents the request ID header name.
    /// </summary>
    public const string RequestId = "request-id";

    /// <summary>
    /// Represents the request ID header name.
    /// </summary>
    public const string TraceId = "trace-id";

    /// <summary>
    /// Represents the user ID header name.
    /// </summary>
    public const string UserId = "user-id";

    /// <summary>
    /// Represents the correlation ID header name.
    /// </summary>
    public const string CorrelationId = "correlation-id";

    /// <summary>
    /// Represents the causation ID header name.
    /// </summary>
    public const string CausationId = "causation-id";

    /// <summary>
    /// Represents the "application/json" content type.
    /// </summary>
    public const string CustomPrefix = "X-";

    /// <summary>
    /// Represents the "application/json" content type.
    /// </summary>
    public const string ApplicationJsonContent = "application/json";

    /// <summary>
    /// Represents the "multipart/form-data" content type.
    /// </summary>
    public const string MultipartFormDataContent = "multipart/form-data";

    /// <summary>
    /// Represents the "application/grpc" content type.
    /// </summary>
    public const string ApplicationGrpcContent = "application/grpc";

    /// <summary>
    /// Represents the "application/problem+json" content type.
    /// </summary>
    public const string ApplicationProblemContent = "application/problem+json";

    /// <summary>
    /// Represents the "Accept-Language" header.
    /// </summary>
    /// public const string Accept_Language = "Accept-Language";
    public const string AcceptLanguage = "Accept-Language";
}
