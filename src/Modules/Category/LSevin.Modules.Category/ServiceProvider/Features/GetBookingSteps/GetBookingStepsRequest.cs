using Microsoft.AspNetCore.Mvc;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

public sealed record GetBookingStepsRequest(string providerId,
    string serviceId,
    string specialistId);
