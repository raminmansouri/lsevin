using System.Text;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

internal sealed class GetUploadFilesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IServiceProviderRepository serviceProviderRepository,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetUploadFilesQuery, GetUploadFilesResponse>
{
    public async Task<Result<GetUploadFilesResponse>> Handle(
        GetUploadFilesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
       
        // Build the query with optional filters
        var sql = new StringBuilder();
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        //var response= AddonProvider.GetAddons();
        var repository = new UploadFilesRepository();

    var seviceDefinition=await        repository.GetServiceDefinitionIdByServiceIdAsync(connection, request.ServiceId);

        var response= await repository.GetByServiceDefinitionIdAsync(connection,
            request.ServiceId, currentLocale);
        return response;
    }


    public const string GetUploadFilesByProviderServiceIdSql = """
SELECT
    common.get_translation(sufr.title_translations, @Language, @FallbackLanguage) AS Title,
    sufr.is_required AS UploadFileRequired,
    common.get_translation(sufr.description_translations, @Language, @FallbackLanguage) AS Description,
    sufr.max_file_size_bytes AS MaxFileSizeBytes,
    CASE
        WHEN sufr.max_file_size_bytes >= 1073741824 THEN ROUND((sufr.max_file_size_bytes / 1073741824.0)::numeric, 2)::text || ' GB'
        WHEN sufr.max_file_size_bytes >= 1048576    THEN ROUND((sufr.max_file_size_bytes / 1048576.0)::numeric, 2)::text || ' MB'
        WHEN sufr.max_file_size_bytes >= 1024       THEN ROUND((sufr.max_file_size_bytes / 1024.0)::numeric, 2)::text || ' KB'
        ELSE sufr.max_file_size_bytes::text || ' B'
    END AS MaxFileSizeLabel,
    COALESCE(sufr.allowed_extensions, ARRAY[]::text[]) AS AllowedExtensions,
    COALESCE(sufr.allowed_mime_types, ARRAY[]::text[]) AS AllowedMimeTypes,
    sufr.max_files AS MaxFiles,
    sufr.display_order AS DisplayOrder,
    sufr.example_file_url AS ExampleFileUrl
FROM category.provider_services ps
INNER JOIN category.service_upload_file_requirements sufr
    ON sufr.service_definition_id = ps.service_definition_id
WHERE ps.id = @ProviderServiceId
  AND ps.is_active = true
ORDER BY sufr.display_order, Title;
""";


    public const string GetUploadFilesByServiceDefinitionIdSql = """
SELECT
    common.get_translation(sufr.title_translations, @Language, @FallbackLanguage) AS Title,
    sufr.is_required AS UploadFileRequired,
    common.get_translation(sufr.description_translations, @Language, @FallbackLanguage) AS Description,
    sufr.max_file_size_bytes AS MaxFileSizeBytes,
    CASE
        WHEN sufr.max_file_size_bytes >= 1073741824 THEN ROUND((sufr.max_file_size_bytes / 1073741824.0)::numeric, 2)::text || ' GB'
        WHEN sufr.max_file_size_bytes >= 1048576    THEN ROUND((sufr.max_file_size_bytes / 1048576.0)::numeric, 2)::text || ' MB'
        WHEN sufr.max_file_size_bytes >= 1024       THEN ROUND((sufr.max_file_size_bytes / 1024.0)::numeric, 2)::text || ' KB'
        ELSE sufr.max_file_size_bytes::text || ' B'
    END AS MaxFileSizeLabel,
    COALESCE(sufr.allowed_extensions, ARRAY[]::text[]) AS AllowedExtensions,
    COALESCE(sufr.allowed_mime_types, ARRAY[]::text[]) AS AllowedMimeTypes,
    sufr.max_files AS MaxFiles,
    sufr.display_order AS DisplayOrder,
    sufr.example_file_url AS ExampleFileUrl
FROM category.service_upload_file_requirements sufr
WHERE sufr.service_definition_id = @ServiceDefinitionId
ORDER BY sufr.display_order, Title;
""";


}

