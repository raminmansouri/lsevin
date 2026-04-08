using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecializedById;

internal sealed record GetSpecializedByIdQuery(Guid ServiceProviderId) : Query<GetSpecialistByIdResponse>
{
    public static GetSpecializedByIdQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
