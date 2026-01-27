using System.Reflection;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BuildingBlocks.Persistence.EfCore.Postgres;

/// <summary>
/// Initializes a new instance of the <see cref="DbContextDesignFactoryBase{TDbContext}"/> class.
/// </summary>
/// <param name="schema">The schema.</param>
/// <param name="connectionStringSection">The connection string section name.</param>
/// <param name="assembly">The assembly.</param>
/// <param name="env">The environment name.</param>
public abstract class DbContextDesignFactoryBase<TDbContext>(
    string schema,
    string connectionStringSection,
    Assembly assembly,
    string? env = null
) : IDesignTimeDbContextFactory<TDbContext>
    where TDbContext : DbContext
{
    private const string EnvironmentName = "ASPNETCORE_ENVIRONMENT";
    private const string DefaultEnvironmentName = Environments.Test;

    /// <inheritdoc/>
    public TDbContext CreateDbContext(string[] args)
    {
        var environmentName = env ?? Environment.GetEnvironmentVariable(EnvironmentName) ?? DefaultEnvironmentName;

        var builder = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile($"appsettings.json")
            .AddJsonFile($"appsettings.{environmentName}.json", true)
            .AddEnvironmentVariables();

        var configuration = builder.Build();

        var connectionStringSectionValue = configuration.GetConnectionStringOrThrow(connectionStringSection);

        var optionsBuilder = new DbContextOptionsBuilder<TDbContext>()
            .UseNpgsql(connectionStringSectionValue, sqlOptions => sqlOptions.ConfigureNpgSqlOptions(assembly, schema))
            .ConfigureDbOptions();

        var instance = Activator.CreateInstance(typeof(TDbContext), optionsBuilder.Options);
        return instance as TDbContext
            ?? throw new InvalidOperationException($"Failed to create instance of {typeof(TDbContext).Name}");
    }
}
