using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecialistPage;

internal sealed record GetSpecialistPageQuery(Guid specialistId)
    : Query<GetSpecialistPageResponse>
{
    public static GetSpecialistPageQuery Of(Guid specialistId) => new(specialistId);
}
