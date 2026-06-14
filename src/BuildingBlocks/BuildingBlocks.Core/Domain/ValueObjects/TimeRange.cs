using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a time range value object.
/// </summary>
public sealed class TimeRange : ValueObject
{
    /// <summary>
    /// Gets the start time.
    /// </summary>
    public TimeSpan StartTime { get; private set; }

    /// <summary>
    /// Gets the end time.
    /// </summary>
    public TimeSpan EndTime { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="TimeRange"/> class.
    /// </summary>
    private TimeRange()
    {
        StartTime = TimeSpan.Zero;
        EndTime = TimeSpan.Zero;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="TimeRange"/> class.
    /// </summary>
    /// <param name="startTime">The start time.</param>
    /// <param name="endTime">The end time.</param>
    [JsonConstructor]
    private TimeRange(TimeSpan startTime, TimeSpan endTime)
        : this()
    {
        StartTime = startTime;
        EndTime = endTime;
    }

    /// <summary>
    /// Represents the factory method for creating a time range.
    /// </summary>
    /// <param name="startTime">The start time.</param>
    /// <param name="endTime">The end time.</param>
    /// <returns>The <see cref="TimeRange"/>.</returns>
    public static TimeRange Of(TimeSpan startTime, TimeSpan endTime)
    {
        Guard.Against.Null(startTime, nameof(startTime));
        Guard.Against.Null(endTime, nameof(endTime));

        CheckRule(new TimeRangeEndTimeMustBeAfterStartTimeRule(startTime, endTime));

        return new TimeRange(startTime, endTime);
    }

    /// <summary>
    /// Deconstructs the time range.
    /// </summary>
    /// <param name="startTime">The start time.</param>
    /// <param name="endTime">The end time.</param>
    public void Deconstruct(out TimeSpan startTime, out TimeSpan endTime)
    {
        startTime = StartTime;
        endTime = EndTime;
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return StartTime;
        yield return EndTime;
    }

    /// <inheritdoc />
    public override string ToString() => $"{StartTime} - {EndTime}";
}

/// <summary>
/// Represents the configuration for the <see cref="TimeRange"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the TimeRange value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<TimeRange> builder)
    {
        builder.Property(b => b.StartTime).HasColumnName(nameof(TimeRange.StartTime).Underscore()).IsRequired();

        builder.Property(b => b.EndTime).HasColumnName(nameof(TimeRange.EndTime).Underscore()).IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the TimeRange value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the TimeRange value object.</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, TimeRange> builder)
        where T : class
    {
        builder.Property(b => b.StartTime).HasColumnName(nameof(TimeRange.StartTime).Underscore()).IsRequired();

        builder.Property(b => b.EndTime).HasColumnName(nameof(TimeRange.EndTime).Underscore()).IsRequired();
    }
}
