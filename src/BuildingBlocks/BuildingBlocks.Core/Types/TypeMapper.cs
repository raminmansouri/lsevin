using System.Collections.Concurrent;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Reflection;

namespace BuildingBlocks.Core.Types;

/// <summary>
/// Represents the type mapper.
/// </summary>
public static class TypeMapper
{
    private static readonly ConcurrentDictionary<Type, string> _typeNameMap = new();
    private static readonly ConcurrentDictionary<string, Type> _typeMap = new();

    /// <summary>
    /// Gets the full type name from a generic Type class.
    /// </summary>
    /// <typeparam name="T">The type.</typeparam>
    /// <returns>The full type name.</returns>
    public static string GetFullTypeName<T>() => ToName(typeof(T));

    /// <summary>
    /// Gets the type name from a generic Type class without namespace.
    /// </summary>
    /// <typeparam name="T">The type.</typeparam>
    /// <returns>The full type name.</returns>
    public static string GetTypeName<T>() => ToName(typeof(T), false);

    /// <summary>
    /// Gets the type name from a Type class without namespace.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The full type name.</returns>
    public static string GetTypeName(Type type) => ToName(type, false);

    /// <summary>
    /// Gets the full type name from a Type class.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The full type name.</returns>
    public static string GetFullTypeName(Type type) => ToName(type);

    /// <summary>
    /// Gets the type name from an instance object without namespace.
    /// </summary>
    /// <param name="o">The object.</param>
    /// <returns>The full type name.</returns>
    public static string GetTypeNameByObject(object o) => ToName(o.GetType(), false);

    /// <summary>
    /// Gets the full type name from an instance object.
    /// </summary>
    /// <param name="o">The object.</param>
    /// <returns>The full type name.</returns>
    public static string GetFullTypeNameByObject(object o) => ToName(o.GetType());

    /// <summary>
    /// Gets the type class from a type name.
    /// </summary>
    /// <param name="typeName">The type name.</param>
    /// <returns>The type class.</returns>
    public static Type GetType(string typeName) => ToType(typeName);

    /// <summary>
    /// Adds a new type to the type mapper.
    /// </summary>
    /// <typeparam name="T">The type.</typeparam>
    /// <param name="name">The name of the type.</param>
    public static void AddType<T>(string name) => AddType(typeof(T), name);

    /// <summary>
    /// Adds a new type to the type mapper.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="name">The name of the type.</param>
    public static void AddType(Type type, string name)
    {
        ToName(type);
        ToType(name);
    }

    /// <summary>
    /// Checks if a type is registered.
    /// </summary>
    /// <typeparam name="T">The type.</typeparam>
    /// <returns>The result of the check.</returns>
    public static bool IsTypeRegistered<T>() => _typeNameMap.ContainsKey(typeof(T));

    /// <summary>
    /// Checks if a type is registered.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="fullName">The full name of the type.</param>
    /// <returns>The result of the check.</returns>
    public static string ToName(Type type, bool fullName = true)
    {
        Guard.Against.Null(type, nameof(type));

        return _typeNameMap.GetOrAdd(
            type,
            _ =>
            {
                var eventTypeName = fullName ? type.FullName! : type.Name;

                _typeMap.GetOrAdd(eventTypeName, type);

                return eventTypeName;
            }
        );
    }

    /// <summary>
    /// Checks if a type is registered.
    /// </summary>
    /// <param name="typeName">The type name.</param>
    /// <returns>The result of the check.</returns>
    /// <exception cref="System.Exception">Type map for '{typeName}' wasn't found.</exception>
    public static Type ToType(string typeName)
    {
        Guard.Against.Empty(typeName, nameof(typeName));

        return _typeMap.GetOrAdd(
            typeName,
            _ =>
            {
                var type = ReflectionUtilities.GetFirstMatchingTypeFromCurrentDomainAssemblies(typeName);

                if (type == null)
                {
                    throw new InvalidOperationException(
                        $"Type map for '{typeName}' wasn't found in any loaded assemblies"
                    );
                }

                return type;
            }
        );
    }
}
