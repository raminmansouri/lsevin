using System.ComponentModel;

namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the extension methods for the enumeration types.
/// </summary>
public static class EnumExtensions
{
    /// <summary>
    /// Gets the attribute of the specified type from the enumeration value.
    /// </summary>
    /// <typeparam name="T">The type of the attribute.</typeparam>
    /// <param name="value">The enumeration value.</param>
    /// <returns>The attribute of the specified type.</returns>
    public static T? GetAttribute<T>(this Enum value)
        where T : Attribute
    {
        var type = value.GetType();
        var memberInfo = type.GetMember(value.ToString());
        var attributes = memberInfo[0].GetCustomAttributes(typeof(T), false);
        return attributes.Length > 0 ? (T)attributes[0] : null;
    }

    /// <summary>
    /// Gets the name of the enumeration value.
    /// </summary>
    /// <param name="value">The enumeration value.</param>
    /// <returns>The name of the enumeration value.</returns>
    public static string ToName(this Enum value)
    {
        var attribute = value.GetAttribute<DescriptionAttribute>();
        return attribute == null ? value.ToString() : attribute.Description;
    }

    /// <summary>
    /// Gets the of the enumeration values.
    /// </summary>
    /// <typeparam name="T">The type of the enumeration.</typeparam>
    /// <returns>The enumeration values.</returns>
    public static IReadOnlyList<T> GetAll<T>()
        where T : Enum
    {
        return Enum.GetValues(typeof(T)).Cast<T>().ToList();
    }
}
