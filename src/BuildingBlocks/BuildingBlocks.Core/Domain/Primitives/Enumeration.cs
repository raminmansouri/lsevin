using System.Reflection;

namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Provides a base class for creating enumeration classes.
/// </summary>
public abstract class Enumeration : IComparable
{
    /// <summary>
    /// Gets the name of the enumeration item.
    /// </summary>
    public string Name { get; }

    /// <summary>
    /// Gets the identifier of the enumeration item.
    /// </summary>
    public int Id { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Enumeration"/> class with the specified identifier and name.
    /// </summary>
    /// <param name="id">The identifier of the enumeration item.</param>
    /// <param name="name">The name of the enumeration item.</param>
    protected Enumeration(int id, string name) => (Id, Name) = (id, name);

    /// <summary>
    /// Implicitly converts the enumeration to an integer.
    /// </summary>
    /// <param name="enumeration">The enumeration.</param>
    public static implicit operator int(Enumeration enumeration) => enumeration.Id;

    /// <inheritdoc />
    public override string ToString() => Name;

    /// <summary>
    /// Gets all enumeration items of the specified type.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <returns>An enumerable collection of enumeration items.</returns>
    public static IEnumerable<T> GetAll<T>()
        where T : Enumeration =>
        typeof(T)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(f => f.GetValue(null))
            .Cast<T>();

    /// <summary>
    /// Gets the count of all enumeration items of the specified type.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <returns>The count of all enumeration items.</returns>
    public static int GetCount<T>()
        where T : Enumeration => GetAll<T>().Count();

    /// <summary>
    /// Gets the maximum identifier of all enumeration items of the specified type.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <returns>The maximum identifier of all enumeration items.</returns>
    public static int GetMaxId<T>()
        where T : Enumeration => GetAll<T>().Max(e => e.Id);

    /// <inheritdoc />
    public override bool Equals(object? obj)
    {
        if (obj is not Enumeration otherValue)
        {
            return false;
        }

        var typeMatches = GetType() == obj.GetType();
        var valueMatches = Id.Equals(otherValue.Id);

        return typeMatches && valueMatches;
    }

    /// <inheritdoc />
    public override int GetHashCode() => Id.GetHashCode();

    /// <summary>
    /// Gets the absolute difference between the identifiers of two enumeration items.
    /// </summary>
    /// <param name="firstValue">The first enumeration item.</param>
    /// <param name="secondValue">The second enumeration item.</param>
    /// <returns>The absolute difference between the identifiers of the enumeration items.</returns>
    public static int AbsoluteDifference(Enumeration firstValue, Enumeration secondValue)
    {
        var absoluteDifference = Math.Abs(firstValue.Id - secondValue.Id);
        return absoluteDifference;
    }

    /// <summary>
    /// Gets the enumeration item of the specified type with the specified identifier.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <param name="value">The identifier of the enumeration item.</param>
    /// <returns>The enumeration item.</returns>
    public static T FromValue<T>(int value)
        where T : Enumeration
    {
        var matchingItem = Parse<T, int>(value, "value", item => item.Id == value);
        return matchingItem;
    }

    /// <summary>
    /// Gets the enumeration item of the specified nullable type with the specified identifier.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <param name="value">The identifier of the enumeration item.</param>
    /// <returns>The enumeration item.</returns>
    public static T? FromValue<T>(int? value)
        where T : Enumeration
    {
        if (value is null)
            return null;

        var matchingItem = Parse<T, int>(value.Value, "value", item => item.Id == value.Value);
        return matchingItem;
    }

    /// <summary>
    /// Gets the enumeration item of the specified type with the specified name.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <param name="displayName">The name of the enumeration item.</param>
    /// <returns>The enumeration item.</returns>
    public static T FromDisplayName<T>(string displayName)
        where T : Enumeration
    {
        var matchingItem = Parse<T, string>(displayName, "display name", item => item.Name == displayName);
        return matchingItem;
    }

    /// <summary>
    /// Parses the specified value to get the enumeration item of the specified type that satisfies a condition.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <typeparam name="TK">The type of the value to parse.</typeparam>
    /// <param name="value">The value to parse.</param>
    /// <param name="description">The description of the value.</param>
    /// <param name="predicate">The condition that the enumeration item must satisfy.</param>
    /// <returns>The enumeration item.</returns>
    private static T Parse<T, TK>(TK value, string description, Func<T, bool> predicate)
        where T : Enumeration
    {
        var matchingItem =
            GetAll<T>().FirstOrDefault(predicate)
            ?? throw new InvalidOperationException($"'{value}' is not a valid {description} in {typeof(T)}");
        return matchingItem;
    }

    /// <summary>
    /// Compares the current object with another object of the same type.
    /// </summary>
    /// <param name="obj">An object to compare with this object.</param>
    /// <returns>A value that indicates the relative order of the objects being compared.</returns>
    public int CompareTo(object? obj) => Id.CompareTo(((Enumeration)obj!).Id);

    /// <summary>
    /// The equality operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the equality operator.</returns>
    public static bool operator ==(Enumeration? left, Enumeration? right)
    {
        if (left is null)
        {
            return right is null;
        }

        return left.Equals(right);
    }

    /// <summary>
    /// The inequality operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the inequality operator.</returns>
    public static bool operator !=(Enumeration? left, Enumeration? right)
    {
        return !(left == right);
    }

    /// <summary>
    /// The less than operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the less than operator.</returns>
    public static bool operator <(Enumeration? left, Enumeration? right)
    {
        return left is null ? right is not null : left.CompareTo(right) < 0;
    }

    /// <summary>
    /// The less than or equal to operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the less than or equal to operator.</returns>
    public static bool operator <=(Enumeration? left, Enumeration? right)
    {
        return left is null || left.CompareTo(right) <= 0;
    }

    /// <summary>
    /// The greater than operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the greater than operator.</returns>
    public static bool operator >(Enumeration? left, Enumeration? right)
    {
        return left is not null && left.CompareTo(right) > 0;
    }

    /// <summary>
    /// The greater than or equal to operator.
    /// </summary>
    /// <param name="left">The left operand.</param>
    /// <param name="right">The right operand.</param>
    /// <returns>The result of the greater than or equal to operator.</returns>
    public static bool operator >=(Enumeration? left, Enumeration? right)
    {
        return left is null ? right is null : left.CompareTo(right) >= 0;
    }
}
