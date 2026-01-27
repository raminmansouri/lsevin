namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionsWithAllLocales;

internal sealed record GetServiceDefinitionsWithAllLocalesRequest(Guid? CategoryId, bool? IsActive);
