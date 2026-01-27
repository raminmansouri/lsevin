using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Represents a rule that validates the end time is after the start time in a time range.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="TimeRangeEndTimeMustBeAfterStartTimeRule"/> class.
/// </remarks>
/// <param name="startTime">The start time to validate.</param>
/// <param name="endTime">The end time to validate.</param>
public sealed class TimeRangeEndTimeMustBeAfterStartTimeRule(TimeSpan startTime, TimeSpan endTime) : IBusinessRule
{
    /// <inheritdoc />
    public bool IsBroken() => endTime <= startTime;

    /// <inheritdoc />
    public string Message => SharedResource.Invalid_Data_Error_Message;
}
