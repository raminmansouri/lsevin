using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Category.Features.GetCategoryById;

internal sealed record GetCategoryByIdQuery(Guid CategoryId) : Query<GetCategoryByIdResponse>;
