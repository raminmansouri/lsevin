using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Services;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Rules;

internal sealed class ServiceProviderGradeMustBeUniqueRule(
    IServiceProviderUniquenessCheckerService uniquenessChecker,
    ProviderTypeId providerTypeId,
    string countryCode,
    string cityCode,
    ServiceProviderGrade? grade,
    ServiceProviderId? id = null
) : IBusinessRule
{
    public bool IsBroken() =>
        grade is not null && !uniquenessChecker.IsGradeUnique(grade, providerTypeId, countryCode, cityCode, id);

    public string Message => CategoryResource.Service_Provider_Grade_Uniqueness_Error;
}
