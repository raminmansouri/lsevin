using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a date range value object.
/// </summary>
public sealed class DateRange : ValueObject
{
    /// <summary>
    /// Gets the start date.
    /// </summary>
    public DateTime StartDate { get; private set; }

    /// <summary>
    /// Gets the end date.
    /// </summary>
    public DateTime EndDate { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="DateRange"/> class.
    /// </summary>
    private DateRange()
    {
        StartDate = DateTime.MinValue;
        EndDate = DateTime.MinValue;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="DateRange"/> class.
    /// </summary>
    /// <param name="startDate">The start date.</param>
    /// <param name="endDate">The end date.</param>
    [JsonConstructor]
    private DateRange(DateTime startDate, DateTime endDate)
        : this()
    {
        StartDate = startDate;
        EndDate = endDate;
    }

    /// <summary>
    /// Represents the factory method for creating a date range.
    /// </summary>
    /// <param name="startDate">The start date.</param>
    /// <param name="endDate">The end date.</param>
    /// <returns>The <see cref="DateRange"/>.</returns>
    public static DateRange Of(DateTime startDate, DateTime endDate)
    {
        Guard.Against.Null(startDate, nameof(startDate));
        Guard.Against.Null(endDate, nameof(endDate));

        CheckRule(new DateRangeEndDateMustBeAfterStartDateRule(startDate, endDate));

        return new DateRange(startDate, endDate);
    }

    /// <summary>
    /// Deconstructs the date range.
    /// </summary>
    /// <param name="startDate">The start date.</param>
    /// <param name="endDate">The end date.</param>
    public void Deconstruct(out DateTime startDate, out DateTime endDate)
    {
        startDate = StartDate;
        endDate = EndDate;
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return StartDate;
        yield return EndDate;
    }

    /// <inheritdoc />
    public override string ToString() => $"{StartDate:d} - {EndDate:d}";
}

/// <summary>
/// Represents the configuration for the <see cref="DateRange"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the DateRange value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<DateRange> builder)
    {
        builder.Property(b => b.StartDate).HasColumnName(nameof(DateRange.StartDate).Underscore()).IsRequired();

        builder.Property(b => b.EndDate).HasColumnName(nameof(DateRange.EndDate).Underscore()).IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the DateRange value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the DateRange value object.</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, DateRange> builder)
        where T : class
    {
        builder.Property(b => b.StartDate).HasColumnName(nameof(DateRange.StartDate).Underscore()).IsRequired();

        builder.Property(b => b.EndDate).HasColumnName(nameof(DateRange.EndDate).Underscore()).IsRequired();
    }
}
