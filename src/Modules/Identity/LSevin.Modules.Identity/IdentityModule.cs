using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Messaging.Extensions;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Web.Module;
using BuildingBlocks.Security.Jwt.Extensions;
using BuildingBlocks.Security.Password.Extensions;
using BuildingBlocks.Web.Extensions;
using BuildingBlocks.Web.Modules;
using LSevin.Modules.Common;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using LSevin.Modules.Identity.Infrastructure.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Environments = BuildingBlocks.Core.Web.Environments;

namespace LSevin.Modules.Identity;

internal sealed class IdentityModule : IModuleDefinition
{
    public void AddModuleServices(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        var connectionString = configuration.GetConnectionStringOrThrow(EfConstants.SqlConnectionStringName);

        var assemblyMarker = IdentityReference.Assembly;

        services.TryAddActivatedSingleton<IModuleInformation, IdentityInformation>();

        services
            .AddApplicationServices(
                configuration,
                applicationAssemblyMarkerTypes: [assemblyMarker, CommonRoot.Assembly]
            )
            .AddPersistenceServices<IdentityContext, IdentitySeeder, IdentityMigrator>(
                IdentityContext.DefaultSchema,
                connectionString,
                assemblyMarker
            )
            .AddInfrastructureServices(
                configuration,
                assemblyMarker: assemblyMarker,
                configureAdditionalServices: s =>
                {
                    s.AddJwtService()
                        .AddPasswordManager()
                        .AddCustomIdentity(
                            configuration,
                            optionSection: $"{IdentityReference.ModuleName}:{nameof(IdentityOptions)}"
                        );

                    if (!environment.IsEnvironment(Environments.Test))
                    {
                        services.AddCustomIdentityServer(configuration);
                    }
                }
            )
            .AddHttpClients();
    }

    public async Task ConfigureModule(
        IApplicationBuilder app,
        IConfiguration configuration,
        ILogger logger,
        IWebHostEnvironment environment
    )
    {
        app.UseRevokeAccessTokenMiddleware();

        if (!environment.IsEnvironment(Environments.Test))
        {
            await app.ApplicationServices.StartHostedServices();
            app.UseIdentityServer();
        }

        app.RegisterDomainEventNotifications()
            .SubscribeAllMessageFromAssemblyOfType(
            // Add all integration events here
            );

        await Task.CompletedTask;
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints) { }
}
