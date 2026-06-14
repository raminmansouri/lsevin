using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionDetails;

internal sealed record GetServiceDefinitionDetailsQuery(Guid ServiceDefinitionId)
    : Query<GetServiceDefinitionDetailsResponse>;
