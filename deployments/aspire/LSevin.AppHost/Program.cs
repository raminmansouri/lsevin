using LSevin.AppHost;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

builder.AddForwardedHeaders();

var postgres = builder
    .AddPostgres(name: "postgres")
    .WithImage("postgres")
    .WithImageTag("17")
    // .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();

var database = postgres.AddDatabase(name: "database", databaseName: "lsevin");

var redis = builder
    .AddRedis(name: "cache")
    .WithImage("redis")
    .WithImageTag("latest")
    // .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithRedisInsight();

var eventstore = builder
    .AddEventStore("eventstore")
    .WithImage("eventstore/eventstore")
    .WithImageTag("latest")
    // .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

if (builder.ExecutionContext.IsRunMode)
{
    postgres.WithDataVolume();
    redis.WithDataVolume();
    eventstore.WithDataVolume();
}

var api = builder
    .AddProject<LSevin_Api>(name: "lsevin-api")
    .WithReference(database)
    .WaitFor(database)
    .WithReference(redis)
    .WaitFor(redis)
    .WithReference(eventstore)
    .WaitFor(eventstore)
    .WithHttpHealthCheck(path: "/hc", endpointName: "http");

var apigateway = builder
    .AddProject<LSevin_ApiGateway_Yarp>(name: "lsevin-apigateway")
    .WithExternalHttpEndpoints()
    .WithReference(api)
    .WaitFor(api)
    .WithHttpHealthCheck(path: "/hc", endpointName: "http");

// Add Next.js webapp
var webapp = builder
    .AddPnpmApp("lsevin-webapp", "../../../frontend/webapp", "dev")
    .WithPnpmPackageInstallation()
    .WaitFor(apigateway)
    .WithReference(apigateway)
    // Pin the webapp to a fixed host port so the local URL is stable across restarts.
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithExternalHttpEndpoints();

webapp.WithEnvironment("AUTH_URL", () => webapp.GetEndpoint("http").Url);
webapp.WithEnvironment("NEXT_PUBLIC_API_URL", () => $"{apigateway.GetEndpoint("http").Url}/api/v1");
webapp.WithEnvironment("NEXT_PUBLIC_SOCKET_URL", () => $"{apigateway.GetEndpoint("http").Url}/api/v1/hubs");

// Server-to-server calls from the webapp (postData/readData) use INTERNAL_API_URL.
// Must be http (the dev HTTPS cert is untrusted, which makes Node's fetch fail);
// route it through the gateway over http like the public URL.
webapp.WithEnvironment("INTERNAL_API_URL", () => $"{apigateway.GetEndpoint("http").Url}/api/v1");

// The Next.js webapp queries Postgres directly (postgres.js) for some server components,
// so it needs a postgres:// URL pointing at the same Aspire-managed database the API uses.
webapp.WithEnvironment(
    "DATABASE_URL",
    ReferenceExpression.Create(
        $"postgres://postgres:{postgres.Resource.PasswordParameter}@{postgres.Resource.PrimaryEndpoint.Property(EndpointProperty.Host)}:{postgres.Resource.PrimaryEndpoint.Property(EndpointProperty.Port)}/lsevin"
    )
);

builder.Build().Run();
