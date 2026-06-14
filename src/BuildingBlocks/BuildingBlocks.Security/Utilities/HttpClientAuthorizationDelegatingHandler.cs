using System.Net.Http.Headers;
using BuildingBlocks.Security.Common;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Security.Utilities;

/// <summary>
/// Delegating handler for adding authorization headers to HttpClient requests.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="HttpClientAuthorizationDelegatingHandler"/> class.
/// </remarks>
/// <param name="httpContextAccessor">The IHttpContextAccessor for accessing the current HttpContext.</param>
public sealed class HttpClientAuthorizationDelegatingHandler(IHttpContextAccessor httpContextAccessor)
    : DelegatingHandler
{
    /// <inheritdoc />
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken
    )
    {
        var authorizationHeader = httpContextAccessor
            .HttpContext?.Request.Headers[nameof(SecurityConstants.Authorization)]
            .FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(authorizationHeader))
        {
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
