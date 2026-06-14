using BuildingBlocks.Security.Common;
using Grpc.Core;

namespace LSevin.Tests.Shared.Extensions;

/// <summary>
/// Builder for configuring gRPC metadata in tests.
/// </summary>
public class GrpcMetadataBuilder
{
    // private readonly Dictionary<string, string> _metadata;
    private string? _token;

    // private string? _language;

    /// <summary>
    /// Initializes a new instance of the <see cref="GrpcMetadataBuilder"/> class.
    /// </summary>
    public GrpcMetadataBuilder()
    {
        // _metadata = [];
    }

    /// <summary>
    /// Sets the JWT token.
    /// </summary>
    /// <param name="token">The JWT token.</param>
    /// <returns>The builder instance.</returns>
    public GrpcMetadataBuilder WithToken(string token)
    {
        _token = token;
        return this;
    }

    /// <summary>
    /// Sets the language.
    /// </summary>
    /// <param name="language">The language code.</param>
    /// <returns>The builder instance.</returns>
    public GrpcMetadataBuilder WithLanguage(string? language = null)
    {
        // _language = language;
        return this;
    }

    /// <summary>
    /// Builds the configured Metadata.
    /// </summary>
    /// <returns>The configured Metadata.</returns>
    public Metadata Build()
    {
        var metadata = new Metadata();

        // Add base metadata
        if (!string.IsNullOrEmpty(_token))
        {
            metadata.Add(nameof(SecurityConstants.Authorization), $"{SecurityConstants.Authorization} {_token}");
        }

        // Add custom metadata
        // foreach (var (key, value) in _metadata)
        // {
        //     metadata.Add(key, value);
        // }

        return metadata;
    }
}
