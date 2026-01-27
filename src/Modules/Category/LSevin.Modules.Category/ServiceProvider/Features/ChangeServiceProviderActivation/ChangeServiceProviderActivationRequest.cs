namespace LSevin.Modules.Category.ServiceProvider.Features.ChangeServiceProviderActivation;

public sealed record ChangeServiceProviderActivationRequest(Guid ServiceProviderId, bool IsActive);
