using System.Reflection;
using System.Web;
using BuildingBlocks.Core.Reflection;

namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the object extensions.
/// </summary>
public static class ObjectExtensions
{
    /// <summary>
    /// Get the query string from an object.
    /// </summary>
    /// <param name="obj">The object.</param>
    /// <returns>The query string.</returns>
    public static string GetQueryString(this object obj)
    {
        var properties = obj.GetType()
            .GetProperties()
            .Where(p => p.GetValue(obj, null) != null)
            .Select(p => p.Name + "=" + HttpUtility.UrlEncode(p.GetValue(obj, null)?.ToString()));

        return string.Join("&", properties.ToArray());
    }

    /// <summary>
    /// Invoke an instance generic method member.
    /// </summary>
    /// <param name="instanceObject">The instance object.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="genericTypes">The generic types.</param>
    /// <param name="returnType">The return type.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result of the method invocation.</returns>
    public static dynamic? InvokeGenericMethod(
        this object instanceObject,
        string methodName,
        Type[] genericTypes,
        Type? returnType = null,
        params object[] parameters
    )
    {
        var method = instanceObject
            .GetType()
            .GetGenericMethod(methodName, genericTypes, parameters.Select(y => y.GetType()).ToArray(), returnType);

        if (method == null)
        {
            return null;
        }

        var genericMethod = method.MakeGenericMethod(genericTypes);
        return genericMethod.Invoke(instanceObject, parameters);
    }

    /// <summary>
    /// Invoke an async instance generic method member.
    /// </summary>
    /// <param name="instanceObject">The instance object.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="genericTypes">The generic types.</param>
    /// <param name="returnType">The return type.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result of the method invocation.</returns>
    public static Task<dynamic>? InvokeGenericMethodAsync(
        this object instanceObject,
        string methodName,
        Type[] genericTypes,
        Type? returnType = null,
        params object[] parameters
    )
    {
        dynamic? awaitable = InvokeGenericMethod(instanceObject, methodName, genericTypes, returnType, parameters);

        return awaitable;
    }

    /// <summary>
    /// Invoke an instance method member.
    /// </summary>
    /// <param name="instanceObject">The instance object.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result of the method invocation.</returns>
    /// <exception cref="InvalidOperationException">The method is not found.</exception>
    public static dynamic InvokeMethod(this object instanceObject, string methodName, params object[] parameters)
    {
        var method = instanceObject
            .GetType()
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance)
            .Where(x => x.Name == methodName)
            .FirstOrDefault(x =>
                x.GetParameters().Select(p => p.ParameterType).All(parameters.Select(p => p.GetType()).Contains)
            );

        return method?.Invoke(instanceObject, parameters) ?? throw new InvalidOperationException("Method not found.");
    }

    /// <summary>
    /// Invoke an instance method member.
    /// </summary>
    /// <param name="instanceObject">The instance object.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result of the method invocation.</returns>
    public static Task<dynamic> InvokeMethodAsync(
        this object instanceObject,
        string methodName,
        params object[] parameters
    )
    {
        var awaitable = InvokeMethod(instanceObject, methodName, parameters);

        return awaitable;
    }

    /// <summary>
    /// Invoke an instance method member with return type <see cref="Task"/> or without return type.
    /// </summary>
    /// <param name="instanceObject">The instance object.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result of the method invocation.</returns>
    public static Task<dynamic?> InvokeMethodWithoutResultAsync(
        this object instanceObject,
        string methodName,
        params object[] parameters
    )
    {
        var awaitable = InvokeMethodAsync(instanceObject, methodName, parameters);

        // ReSharper disable once NullCoalescingConditionIsAlwaysNotNullAccordingToAPIContract
        return awaitable ?? Task.FromResult((dynamic?)null);
    }

    /// <summary>
    /// Checks if the object is a primitive type.
    /// </summary>
    /// <param name="obj">The object.</param>
    /// <returns>The result of the check.</returns>
    public static bool IsPrimitiveType(this object? obj)
    {
        return obj == null || obj.GetType().IsPrimitiveType();
    }

    /// <summary>
    /// Converts the specified value to a value object.
    /// </summary>
    /// <typeparam name="TIn">The type of the value.</typeparam>
    /// <typeparam name="TOut">The type of the value object.</typeparam>
    /// <param name="value">The value.</param>
    /// <param name="generate">The generator function.</param>
    /// <returns>The converted value object.</returns>
    public static TOut? HandleIfNotNull<TIn, TOut>(this TIn? value, Func<TIn, TOut> generate)
    {
        return value is null ? default : generate(value);
    }
}
