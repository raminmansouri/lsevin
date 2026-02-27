echo off

dotnet ef migrations add ReAddCurrencyTable  --project .\src\Modules\Category\LSevin.Modules.Category\LSevin.Modules.Category.csproj  --startup-project .\src\API\LSevin.Api\LSevin.Api.csproj