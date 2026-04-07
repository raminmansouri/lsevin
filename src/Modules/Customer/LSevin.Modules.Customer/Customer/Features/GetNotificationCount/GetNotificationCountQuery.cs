using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetNotificationCountQuery()
    : Query<GetNotificationCountResponse>
{

    internal static GetNotificationCountQuery? Of=>new GetNotificationCountQuery();
}
