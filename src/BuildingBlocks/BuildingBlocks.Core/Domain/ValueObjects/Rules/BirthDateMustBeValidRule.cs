using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Represents a rule for validating a date of birth.
/// </summary>
internal sealed class BirthDateMustBeValidRule(DateTime dateOfBirth) : IBusinessRule
{
    /// <inheritdoc />
    public bool IsBroken()
    {
        var today = SystemClock.Today;
        return dateOfBirth > today || dateOfBirth < today.AddYears(-GlobalDomainConstValues.MaxAge);
    }

    /// <inheritdoc />
    public string Message => SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Birth_Date);
}
