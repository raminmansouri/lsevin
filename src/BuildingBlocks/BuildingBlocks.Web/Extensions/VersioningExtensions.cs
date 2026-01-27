using Asp.Versioning;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Extension methods for applying API versioning to the service collection.
/// </summary>
public static class VersioningExtensions
{
    private const string GroupNameFormat = "'v'VVV";
    private const int DefaultMajorVersion = 1;
    private const int DefaultMinorVersion = 0;

    /// <summary>
    /// Apply API versioning service to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddVersioningService(this IServiceCollection services)
    {
        services
            .AddApiVersioning(options =>
            {
                options.ReportApiVersions = true;
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.DefaultApiVersion = new ApiVersion(DefaultMajorVersion, DefaultMinorVersion);
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
                options.AssumeDefaultVersionWhenUnspecified = true;

                options
                    .Policies.Sunset(0.9)
                    .Effective(DateTimeOffset.Now.AddDays(60))
                    .Link("policy.html")
                    .Title("Versioning Policy")
                    .Type("text/html");
            })
            .AddMvc()
            .AddApiExplorer(setup =>
            {
                setup.GroupNameFormat = GroupNameFormat;
                setup.SubstituteApiVersionInUrl = true;
            })
            .EnableApiVersionBinding();

        return services;
    }
}
