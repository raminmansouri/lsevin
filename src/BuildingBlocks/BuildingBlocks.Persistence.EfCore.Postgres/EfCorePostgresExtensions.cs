using System.Reflection;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Persistence.Interceptors;
using BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace BuildingBlocks.Persistence.EfCore.Postgres;

/// <summary>
/// Provides extension methods for the EF Core Postgres persistence layer.
/// </summary>
public static class EfCorePostgresExtensions
{
    private const int MaxRetryCount = 5;
    private const int MaxRetryDelaySeconds = 30;

    /// <summary>
    /// Adds the Postgres database context to the specified services collection.
    /// </summary>
    /// <typeparam name="TDbContext">The type of the database context.</typeparam>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="schemaName">The schema name.</param>
    /// <param name="connectionString">The connection string to use for the database.</param>
    /// <param name="assemblyMarker">The assembly that marks the project.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddPostgresDbContext<TDbContext>(
        this IServiceCollection services,
        string schemaName,
        string connectionString,
        Assembly assemblyMarker
    )
        where TDbContext : DbContext, IBaseDbContext
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        services.AddDbContext<TDbContext>(
            (sp, options) =>
                options
                    .UseNpgsql(
                        connectionString,
                        sqlOptions => sqlOptions.ConfigureNpgSqlOptions(assemblyMarker, schemaName)
                    )
                    .ConfigureDbOptions()
                    .AddInterceptors(
                        sp.GetRequiredService<InsertOutboxMessagesInterceptor>(),
                        sp.GetRequiredService<AuditableEntityInterceptor>()
                    )
        );

        services.AddScoped<IBaseDbContext>(sp => sp.GetRequiredService<TDbContext>());
        return services;
    }

    /// <summary>
    /// Configures SQL Server options for a DbContext.
    /// </summary>
    /// <param name="sqlOptions">The SQL Server DbContext options builder.</param>
    /// <param name="migrationAssembly">The migration assembly.</param>
    /// <param name="schemaName">The schema name.</param>
    public static void ConfigureNpgSqlOptions(
        this NpgsqlDbContextOptionsBuilder sqlOptions,
        Assembly migrationAssembly,
        string schemaName
    )
    {
        sqlOptions.MigrationsHistoryTable(HistoryRepository.DefaultTableName, schemaName);

        sqlOptions.MigrationsAssembly(migrationAssembly.GetName().FullName);

        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: MaxRetryCount,
            maxRetryDelay: TimeSpan.FromSeconds(MaxRetryDelaySeconds),
            errorCodesToAdd: null
        );
    }

    /// <summary>
    /// Adds the connection factory to the specified services collection.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="connectionString">The connection string to use for the database.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddConnectionFactory(this IServiceCollection services, string connectionString)
    {
        services.TryAddScoped<IDbConnectionFactory>(_ => new DbConnectionFactory(connectionString));

        return services;
    }
}
