namespace BuildingBlocks.Core.Types;

/// <summary>
/// Provides extension methods for working with generic types in the context of an event bus.
/// </summary>
public static class GenericTypeExtensions
{
    /// <summary>
    /// Gets the generic type name of the provided <see cref="Type"/>.
    /// </summary>
    /// <param name="type">The <see cref="Type"/> for which to retrieve the generic type name.</param>
    /// <returns>The generic type name as a string.</returns>
    public static string GetGenericTypeName(this Type type)
    {
        string typeName;

        if (type.IsGenericType)
        {
            var genericTypes = string.Join(",", type.GetGenericArguments().Select(t => t.Name).ToArray());
            typeName = $"{type.Name.Remove(type.Name.IndexOf('`', StringComparison.Ordinal))}<{genericTypes}>";
        }
        else
        {
            typeName = type.Name;
        }

        return typeName;
    }

    /// <summary>
    /// Gets the generic type name of the provided object's type.
    /// </summary>
    /// <param name="obj">The object for which to retrieve the generic type name.</param>
    /// <returns>The generic type name of the object's type as a string.</returns>
    public static string GetGenericTypeName(this object obj)
    {
        return obj.GetType().GetGenericTypeName();
    }

    /// <summary>
    /// Evaluates a value and executes an action if the value is not null.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="obj">The object to match.</param>
    /// <param name="action">The action to execute if the value is not null.</param>
    /// <returns>A value representing the result of the operation.</returns>
    public static T Tap<T>(this T obj, Action<T> action)
    {
        action(obj);

        return obj;
    }
}
