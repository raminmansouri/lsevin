FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER app
WORKDIR /app

EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["global.json", "."]
COPY ["src/Packages.props", "."]
COPY ["src/Directory.Packages.props", "."]
COPY ["src/Directory.Build.props", "."]
COPY ["src/Directory.Build.targets", "."]
COPY ["src/API/LSevin.Api/LSevin.Api.csproj", "src/API/LSevin.Api/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Caching/BuildingBlocks.Caching.csproj", "src/BuildingBlocks/BuildingBlocks.Caching/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Core/BuildingBlocks.Core.csproj", "src/BuildingBlocks/BuildingBlocks.Core/"]
COPY ["src/BuildingBlocks/BuildingBlocks.OpenTelemetry/BuildingBlocks.OpenTelemetry.csproj", "src/BuildingBlocks/BuildingBlocks.OpenTelemetry/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Persistence.EfCore.Postgres/BuildingBlocks.Persistence.EfCore.Postgres.csproj", "src/BuildingBlocks/BuildingBlocks.Persistence.EfCore.Postgres/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Security/BuildingBlocks.Security.csproj", "src/BuildingBlocks/BuildingBlocks.Security/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Web/BuildingBlocks.Web.csproj", "src/BuildingBlocks/BuildingBlocks.Web/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Persistence.EventStoreDB/BuildingBlocks.Persistence.EventStoreDB.csproj", "src/BuildingBlocks/BuildingBlocks.Persistence.EventStoreDB/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Validation/BuildingBlocks.Validation.csproj", "src/BuildingBlocks/BuildingBlocks.Validation/"]
COPY ["src/Modules/Identity/LSevin.Modules.Identity/LSevin.Modules.Identity.csproj", "src/Modules/Identity/LSevin.Modules.Identity/"]
COPY ["src/Modules/Common/LSevin.Modules.Common/LSevin.Modules.Common.csproj", "src/Modules/Common/LSevin.Modules.Common/"]
RUN dotnet restore "src/API/LSevin.Api/LSevin.Api.csproj"
COPY . .
WORKDIR "/src/src/API/LSevin.Api"
RUN dotnet build "./LSevin.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build -p:RunAnalyzers=false -p:RunCodeAnalysis=false -p:EnforceCodeStyleInBuild=false -p:TreatWarningsAsErrors=false -p:NoWarn=1591 -p:GenerateDocumentationFile=false

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./LSevin.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false -p:RunAnalyzers=false -p:RunCodeAnalysis=false -p:EnforceCodeStyleInBuild=false -p:TreatWarningsAsErrors=false -p:NoWarn=1591 -p:GenerateDocumentationFile=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "LSevin.Api.dll"]
