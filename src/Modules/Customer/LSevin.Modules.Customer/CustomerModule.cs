using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Messaging.Extensions;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Web.Module;
using BuildingBlocks.Web.Extensions;
using BuildingBlocks.Web.Modules;
using LSevin.Modules.Common;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using LSevin.Modules.Customer.Infrastructure.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Environments = BuildingBlocks.Core.Web.Environments;

namespace LSevin.Modules.Customer;

internal sealed class CustomerModule : IModuleDefinition
{
    public void AddModuleServices(
        IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        var connectionString = configuration.GetConnectionStringOrThrow(EfConstants.SqlConnectionStringName);

        var assemblyMarker = CustomerReference.Assembly;

        services.TryAddActivatedSingleton<IModuleInformation, CustomerInformation>();

        services
            .AddApplicationServices(
                configuration,
                applicationAssemblyMarkerTypes: [assemblyMarker, CommonRoot.Assembly]
            )
            .AddPersistenceServices<CustomerContext, CustomerSeeder, CustomerMigrator>(
                CustomerContext.DefaultSchema,
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

        app.RegisterDomainEventNotifications()
            .SubscribeAllMessageFromAssemblyOfType(
                typeof(UserRegisteredIntegrationEvent),
                typeof(UserUpdatedIntegrationEvent),
                typeof(UserStateUpdatedIntegrationEvent)
            );

        await Task.CompletedTask;
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints) { }
}
