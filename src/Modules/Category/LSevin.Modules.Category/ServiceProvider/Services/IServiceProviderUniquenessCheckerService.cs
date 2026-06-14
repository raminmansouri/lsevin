using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Services;

public interface IServiceProviderUniquenessCheckerService : IDomainService
{
    Result<bool> IsGradeUnique(
        ServiceProviderGrade grade,
        ProviderTypeId providerTypeId,
        string countryCode,
        string cityCode,
        ServiceProviderId? serviceProviderId = null
    );
}
