using Microsoft.AspNetCore.Mvc;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

public sealed record GetBookingStepsRequest(bool? IsActive, Guid[]? ProviderTypeIds);
