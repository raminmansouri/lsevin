namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

public sealed record GetServiceDefinitionsRequest(Guid? CategoryId, bool? IsActive);
