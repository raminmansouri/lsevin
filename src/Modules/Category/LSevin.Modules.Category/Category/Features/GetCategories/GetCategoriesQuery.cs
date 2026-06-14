using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.Category.Features.GetCategories;

internal sealed record GetCategoriesQuery : PageQuery<IPageList<GetCategoriesResponse>>;
