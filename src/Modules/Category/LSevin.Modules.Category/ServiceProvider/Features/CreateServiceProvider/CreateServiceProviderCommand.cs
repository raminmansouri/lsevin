using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.CreateServiceProvider;

internal sealed record CreateServiceProviderCommand(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    string ContactEmail,
    string ContactPhone,
    string CountryCode,
    AddressDto Address,
    Guid ProviderTypeId,
    bool IsActive,
    int? GradeId
) : Command<Guid>;
