using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultings;

internal sealed record GetConsultingsQuery : PageQuery<IPageList<GetConsultingsResponse>>;
