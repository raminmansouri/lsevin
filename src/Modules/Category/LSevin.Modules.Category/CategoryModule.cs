using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Web.Module;
using BuildingBlocks.Web.Extensions;
using BuildingBlocks.Web.Modules;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Infrastructure.Extensions;
using LSevin.Modules.Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Environments = BuildingBlocks.Core.Web.Environments;

namespace LSevin.Modules.Category;

internal sealed class CategoryModule : IModuleDefinition
{
    public void AddModuleServices(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        var connectionString = configuration.GetConnectionStringOrThrow(EfConstants.SqlConnectionStringName);

        var assemblyMarker = CategoryReference.Assembly;

        services.TryAddActivatedSingleton<IModuleInformation, CategoryInformation>();

        services
            .AddApplicationServices(
                configuration,
                applicationAssemblyMarkerTypes: [assemblyMarker, CommonRoot.Assembly]
            )
            .AddPersistenceServices<CategoryContext, CategorySeeder, CategoryMigrator>(
                CategoryContext.DefaultSchema,
                connectionString,
                assemblyMarker
            )
            .AddInfrastructureServices(
                configuration,
                assemblyMarker: assemblyMarker,
                configureAdditionalServices: s => s.AddHttpClients()
            );
    }

    public async Task ConfigureModule(
        IApplicationBuilder app,
        IConfiguration configuration,
        ILogger logger,
        IWebHostEnvironment environment
    )
    {
        if (!environment.IsEnvironment(Environments.Test))
        {
            await app.ApplicationServices.StartHostedServices();
        }

        // app.RegisterDomainEventNotifications()
        //     .SubscribeAllMessageFromAssemblyOfType(
        //     );

        await Task.CompletedTask;
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints) { }
}
