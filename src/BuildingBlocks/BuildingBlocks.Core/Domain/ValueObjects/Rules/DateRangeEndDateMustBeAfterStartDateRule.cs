using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Represents a rule that validates the end date is after the start date in a date range.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="DateRangeEndDateMustBeAfterStartDateRule"/> class.
/// </remarks>
/// <param name="startDate">The start date to validate.</param>
/// <param name="endDate">The end date to validate.</param>
public sealed class DateRangeEndDateMustBeAfterStartDateRule(DateTime startDate, DateTime endDate) : IBusinessRule
{
    /// <inheritdoc />
    public bool IsBroken() => endDate <= startDate;

    /// <inheritdoc />
    public string Message => SharedResource.Invalid_Data_Error_Message;
}
