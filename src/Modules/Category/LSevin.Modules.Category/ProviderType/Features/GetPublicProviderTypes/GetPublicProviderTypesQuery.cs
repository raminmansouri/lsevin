using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ProviderType.Features.GetPublicProviderTypes;

internal sealed record GetPublicProviderTypesQuery : Query<IReadOnlyList<GetPublicProviderTypesResponse>>;
