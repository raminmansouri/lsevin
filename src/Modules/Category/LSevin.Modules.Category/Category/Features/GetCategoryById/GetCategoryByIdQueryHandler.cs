using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.GetCategoryById;

internal sealed class GetCategoryByIdQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetCategoryByIdQuery, GetCategoryByIdResponse>
{
    public async Task<Result<GetCategoryByIdResponse>> Handle(
        GetCategoryByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("CategoryId", request.CategoryId);

        // SQL query to get category by ID with JSONB translations
        var sql = """
            SELECT
               c.image_url,
               c.id,
                c.name_translations,
                c.description_translations,
                c.parent_id,
                p.name_translations as parent_name_translations,
                c.display_order,
                c.is_active,
                c.icon_url,
                c.create_date,
                c.last_modified_date
            FROM category.categories c
            LEFT JOIN category.categories p ON c.parent_id = p.id
            WHERE c.id = @CategoryId
            """;

        var result = await connection.QueryFirstOrDefaultAsync(
            new CommandDefinition(sql, parameters, cancellationToken: cancellationToken)
        );

        if (result is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Category);

        // Parse JSONB columns and create LocalizedContentResponseDto objects
        var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>((string)result.name_translations);
        var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            (string)result.description_translations
        );

        // Handle parent name if exists
        string? parentName = null;
        if (result.parent_name_translations is not null)
        {
            var parentTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                (string)result.parent_name_translations
            );
            parentName = parentTranslations?.Values.FirstOrDefault(); // Use first available translation for parent name
        }

        var response = new GetCategoryByIdResponse(
            CategoryId: (Guid)result.id,
            Name: LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new Dictionary<string, string>()),
            Description: LocalizedContentResponseDto.FromTranslations(
                descriptionTranslations ?? new Dictionary<string, string>()
            ),
            ParentId: (Guid?)result.parent_id,
            ParentName: parentName,
            DisplayOrder: (int)result.display_order,
            IsActive: (bool)result.is_active,
            ImageUrl: (string)result.image_url,
            IconUrl: (string?)result.icon_url,
            CreateDate: (DateTime)result.create_date,
            LastModifiedDate: (DateTime?)result.last_modified_date
        );

        return response;
    }
}
