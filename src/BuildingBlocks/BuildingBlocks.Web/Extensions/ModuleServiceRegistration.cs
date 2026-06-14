using System.Reflection;
using BuildingBlocks.Caching.Extensions;
using BuildingBlocks.Caching.Middlewares;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.FileUpload.Extensions;
using BuildingBlocks.Core.Logging.Middlewares;
using BuildingBlocks.Core.Messaging.Extensions;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Observability.Behaviors;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using BuildingBlocks.Core.Persistence.Middlewares;
using BuildingBlocks.Core.Resiliency.Extensions;
using BuildingBlocks.Core.Scheduling;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.ThreadLock;
using BuildingBlocks.Persistence.EfCore.Postgres;
using BuildingBlocks.Persistence.EventStoreDB;
using BuildingBlocks.Security.Jwt.Extensions;
using BuildingBlocks.Validation.Middlewares;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Quartz;
using Serilog.Extensions.Logging;
using Sieve.Services;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Provides extension methods to register base application services.
/// </summary>
public static class ModuleServiceRegistration
{
    private const string LuckyPennyMediatRLicenceKey = "LuckyPennyOptions:MediatRLicenceKey";
    private const string LuckyPennyAutoMapperLicenseKey = "LuckyPennyOptions:AutoMapperLicenseKey";

    /// <summary>
    /// Registers base application services in the dependency injection container.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to which services are added.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="mediatrExtraConfiguration">The action to configure MediatR services.</param>
    /// <param name="applicationAssemblyMarkerTypes">The assembly containing application services.</param>
    /// <returns>The modified <see cref="IServiceCollection"/> with registered services.</returns>
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<MediatRServiceConfiguration>? mediatrExtraConfiguration = null,
        params Assembly[] applicationAssemblyMarkerTypes
    ) =>
        services
            .AddValidatorsFromAssemblies(applicationAssemblyMarkerTypes, includeInternalTypes: true)
            .AddMediatR(cfg =>
            {
                cfg.LicenseKey = configuration.GetValue<string>(LuckyPennyMediatRLicenceKey);
                cfg.RegisterServicesFromAssemblies(applicationAssemblyMarkerTypes);
                cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
                cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
                cfg.AddOpenBehavior(typeof(CachingBehavior<,>));
                cfg.AddOpenBehavior(typeof(InvalidateCachingBehavior<,>));
                cfg.AddOpenBehavior(typeof(TransactionBehavior<,>));
                cfg.AddOpenBehavior(typeof(ObservabilityPipelineBehavior<,>));
                mediatrExtraConfiguration?.Invoke(cfg);
            })
            .AddMessaging(applicationAssemblyMarkerTypes)
            .RegisterProjectDomainServices(applicationAssemblyMarkerTypes);

    /// <summary>
    /// Adds the base persistence services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="schemaName">The schema name.</param>
    /// <param name="connectionString">The connection string to use for the database.</param>
    /// <param name="assemblyMarker">The assembly that marks the project.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddPersistenceServices<TContext, TDbSeeder, TDbMigrator>(
        this IServiceCollection services,
        string schemaName,
        string connectionString,
        Assembly assemblyMarker
    )
        where TContext : DbContext, IBaseDbContext
        where TDbSeeder : class, IDbSeeder
        where TDbMigrator : class, IDbMigrator =>
        services
            .AddConnectionFactory(connectionString)
            .RegisterTypedIdHandlers(assemblyMarker, typeof(IAggregateRoot).Assembly)
            .AddBaseInterceptor()
            .AddBaseSpecifications()
            .RegisterProjectRepositories(assemblyMarker)
            .AddPostgresDbContext<TContext>(schemaName, connectionString, assemblyMarker)
            .AddScoped<IDbMigrator, TDbMigrator>()
            .AddScoped<IDbSeeder, TDbSeeder>()
            .AddHostedService<MigrationWorker>()
            .AddHostedService<SeedWorker>();

    /// <summary>
    /// Adds base infrastructure services to the specified services collection.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="assemblyMarker">The assembly that marks the project.</param>
    /// <param name="configureJobs">The action to configure jobs.</param>
    /// <param name="configureAdditionalServices">The action to configure additional services.</param>
    /// <returns>The updated service collection with base infrastructure services added.</returns>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        Assembly assemblyMarker,
        Action<IServiceCollectionQuartzConfigurator>? configureJobs = null,
        Action<IServiceCollection>? configureAdditionalServices = null
    )
    {
        services.TryAddScoped<ISieveProcessor, ApplicationSieveProcessor>();
        services.AddSingleton<ILoggerFactory>(new SerilogLoggerFactory());

        services
            .AddHttpContextAccessor()
            .AddCustomResiliency()
            .AddUserAccessor()
            .AddLocalizationServices()
            .AddExclusiveLock()
            .AddCaching(configuration)
            .AddDefaultSerialization()
            .AddFileUploadService()
            .AddEventBus()
            .AddScheduler(configureJobs)
            .AddStoredMessageService(assemblyMarker)
            .AddEventStore(configuration, assemblyMarker)
            .AddAutoMapper(
                cfg => cfg.LicenseKey = configuration.GetValue<string>(LuckyPennyAutoMapperLicenseKey),
                assemblyMarker,
                typeof(DtoMappings).Assembly
            );

        configureAdditionalServices?.Invoke(services);

        return services;
    }

    /// <summary>
    /// Registers the project domain services.
    /// </summary>
    /// <param name="services">The service collection to register the repositories with.</param>
    /// <param name="applicationAssemblyMarkerTypes">The assembly that marks the domain services assemblies.</param>
    private static IServiceCollection RegisterProjectDomainServices(
        this IServiceCollection services,
        params Assembly[] applicationAssemblyMarkerTypes
    )
    {
        return services.Scan(scan =>
            scan.FromAssemblies(applicationAssemblyMarkerTypes)
                .AddClasses(classes => classes.AssignableTo<IDomainService>(), publicOnly: false)
                .AsImplementedInterfaces()
                .WithScopedLifetime()
        );
    }
}
