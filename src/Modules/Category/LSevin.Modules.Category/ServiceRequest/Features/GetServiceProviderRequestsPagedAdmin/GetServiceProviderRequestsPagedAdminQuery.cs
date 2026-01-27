using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsPagedAdmin;

internal sealed record GetServiceProviderRequestsPagedAdminQuery
    : PageQuery<IPageList<GetServiceProviderRequestsPagedAdminResponse>> { }
