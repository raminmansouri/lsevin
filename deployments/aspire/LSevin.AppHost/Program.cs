using LSevin.AppHost;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

builder.AddForwardedHeaders();

var postgres = builder
    .AddPostgres(name: "postgres")
    .WithImage("postgres")
    .WithImageTag("latest")
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
    .WithHttpHealthCheck(path: "/hc");

var apigateway = builder
    .AddProject<LSevin_ApiGateway_Yarp>(name: "lsevin-apigateway")
    .WithExternalHttpEndpoints()
    .WithReference(api)
    .WaitFor(api)
    .WithHttpHealthCheck(path: "/hc");

// Add Next.js webapp
var webapp = builder
    .AddPnpmApp("lsevin-webapp", "../../../frontend/webapp", "dev")
    .WithPnpmPackageInstallation()
    .WaitFor(apigateway)
    .WithReference(apigateway)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

webapp.WithEnvironment("AUTH_URL", () => webapp.GetEndpoint("http").Url);
webapp.WithEnvironment("NEXT_PUBLIC_API_URL", () => $"{apigateway.GetEndpoint("http").Url}/api/v1");
webapp.WithEnvironment("NEXT_PUBLIC_SOCKET_URL", () => $"{apigateway.GetEndpoint("http").Url}/api/v1/hubs");

builder.Build().Run();
