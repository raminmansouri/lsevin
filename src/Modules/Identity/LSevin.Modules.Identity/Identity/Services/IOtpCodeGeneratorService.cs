using BuildingBlocks.Core.Domain.Services;
using LSevin.Modules.Identity.Constants;

namespace LSevin.Modules.Identity.Identity.Services;

public interface IOtpCodeGeneratorService : IDomainService
{
    string GenerateCode(int length = DomainConstValues.PhoneLoginCodeMaxLength);

    DateTime CalculateExpiration(
        DateTime sentAt,
        int expirationMinutes = DomainConstValues.PhoneLoginCodeExpirationMinutes
    );
}
