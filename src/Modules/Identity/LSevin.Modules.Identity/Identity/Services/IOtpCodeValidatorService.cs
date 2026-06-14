using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;

namespace LSevin.Modules.Identity.Identity.Services;

public interface IOtpCodeValidatorService : IDomainService
{
    Result<PhoneLoginCode> ValidateCode(Guid userId, string code, out PhoneLoginCode? phoneLoginCode);

    Result<bool> CanResendCode(Guid userId, int recentCodesCount);

    void InvalidateExistingCodes(IEnumerable<PhoneLoginCode> existingCodes);
}
