using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository
{
    using Dapper;
    using LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;
    using System.Data;

    public sealed class UploadFilesRepository
    {

        public async Task<Guid?> GetServiceDefinitionIdByServiceIdAsync(
      IDbConnection connection,
      Guid serviceId,
      IDbTransaction? transaction = null)
        {
            const string sql = """
        SELECT ps.service_definition_id
        FROM category.provider_services ps
        WHERE ps.id = @ServiceId
        LIMIT 1;
        """;

            return await connection.QuerySingleOrDefaultAsync<Guid?>(
                sql,
                new { ServiceId = serviceId },
                transaction);
        }

        public async Task<GetUploadFilesResponse> GetByProviderServiceIdAsync(
            IDbConnection connection,
            Guid providerServiceId,
            string language = "en",
            string fallbackLanguage = "en",
            IDbTransaction? transaction = null)
        {
            var items = (await connection.QueryAsync<UploadFile>(
                GetUploadFilesByProviderServiceIdSql,
                new
                {
                    ProviderServiceId = providerServiceId,
                    Language = language,
                    FallbackLanguage = fallbackLanguage
                },
                transaction)).AsList();

            return new GetUploadFilesResponse
            {
                UploadFiles = items.ToArray()
            };
        }

        public async Task<GetUploadFilesResponse> GetByServiceDefinitionIdAsync(
            IDbConnection connection,
            Guid serviceDefinitionId,
            string language = "en",
            string fallbackLanguage = "en",
            IDbTransaction? transaction = null)
        {
            var items = (await connection.QueryAsync<UploadFile>(
                GetUploadFilesByServiceDefinitionIdSql,
                new
                {
                    ServiceDefinitionId = serviceDefinitionId,
                    Language = language,
                    FallbackLanguage = fallbackLanguage
                },
                transaction)).AsList();

            return new GetUploadFilesResponse
            {
                UploadFiles = items.ToArray()
            };
        }

        private const string GetUploadFilesByProviderServiceIdSql = """
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

        private const string GetUploadFilesByServiceDefinitionIdSql = """
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
}
