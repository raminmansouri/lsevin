using System.Text;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Opt = Microsoft.Extensions.Options.Options;

namespace BuildingBlocks.Security.Jwt.Options;

/// <summary>
/// This class is responsible for configuring JWT settings using an IConfiguration instance.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ConfigureJwtBearerOptions"/> class.
/// </remarks>
/// <param name="configuration">The IConfiguration instance containing JWT configuration settings.</param>
internal sealed class ConfigureJwtBearerOptions(IConfiguration configuration) : IConfigureNamedOptions<JwtBearerOptions>
{
    private const string AccessTokenParameter = "access_token";
    private const string HubsPath = "/hubs";

    /// <inheritdoc />
    public void Configure(JwtBearerOptions options)
    {
        Configure(Opt.DefaultName, options);
    }

    /// <inheritdoc />
    public void Configure(string? name, JwtBearerOptions options)
    {
        var jwtOptions = configuration.GetSettings<JwtOptions>(nameof(JwtOptions));

        options.Audience = jwtOptions.Audience ?? string.Empty;
        options.SaveToken = true;
        options.RefreshOnIssuerKeyNotFound = false;
        options.RequireHttpsMetadata = false;
        options.IncludeErrorDetails = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = !string.IsNullOrWhiteSpace(jwtOptions.Audience),
            ValidAudience = jwtOptions.Audience,
            ValidateIssuer = true,
            ValidateLifetime = true,
            SaveSigninToken = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception is SecurityTokenExpiredException)
                {
                    throw new UnAuthorizedException("The Token is expired.");
                }

                throw new IdentityException(context.Exception.Message, statusCode: StatusCodes.Status401Unauthorized);
            },
            OnChallenge = _ => Task.CompletedTask,
            OnForbidden = _ => throw new ForbiddenException("You are not authorized to access this resource."),
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query[AccessTokenParameter];

                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(HubsPath, StringComparison.Ordinal))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
        };
    }
}
