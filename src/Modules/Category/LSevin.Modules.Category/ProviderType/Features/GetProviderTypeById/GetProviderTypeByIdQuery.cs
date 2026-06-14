using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeById;

internal sealed record GetProviderTypeByIdQuery(Guid ProviderTypeId) : Query<GetProviderTypeByIdResponse>;
