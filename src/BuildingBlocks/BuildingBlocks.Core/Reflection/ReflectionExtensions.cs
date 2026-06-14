using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Reflection;

/// <summary>
/// Represents the reflection extensions.
/// </summary>
public static class ReflectionExtensions
{
    /// <summary>
    /// The type cache keys.
    /// </summary>
    private static readonly ConcurrentDictionary<Type, string> _typeCacheKeys = new();

    /// <summary>
    /// The pretty print cache.
    /// </summary>
    private static readonly ConcurrentDictionary<Type, string> _prettyPrintCache = new();

    /// <summary>
    /// The public instance members flag.
    /// </summary>
    public const BindingFlags PublicInstanceMembersFlag = BindingFlags.Public | BindingFlags.Instance;

    /// <summary>
    /// The all instance members flag.
    /// </summary>
    public const BindingFlags AllInstanceMembersFlag =
        BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;

    /// <summary>
    /// The all static and instance members flag.
    /// </summary>
    public const BindingFlags AllStaticAndInstanceMembersFlag =
        PublicInstanceMembersFlag | BindingFlags.NonPublic | BindingFlags.Static;

    /// <summary>
    /// Invoke a static generic method.
    /// </summary>
    /// <param name="type"></param>
    /// <param name="methodName"></param>
    /// <param name="genericTypes"></param>
    /// <param name="returnType"></param>
    /// <param name="parameters"></param>
    /// <returns></returns>
    public static dynamic? InvokeGenericMethod(
        this Type type,
        string methodName,
        Type[] genericTypes,
        Type? returnType = null,
        params object[] parameters
    )
    {
        var method = GetGenericMethod(
            type,
            methodName,
            genericTypes,
            parameters.Select(y => y.GetType()).ToArray(),
            returnType
        );

        if (method == null)
        {
            return null;
        }

        var genericMethod = method.MakeGenericMethod(genericTypes);
        return genericMethod.Invoke(null, parameters);
    }

    /// <summary>
    /// Get a generic method.
    /// </summary>
    /// <param name="t">The type.</param>
    /// <param name="name">The method name.</param>
    /// <param name="genericArgTypes">The generic argument types.</param>
    /// <param name="argTypes">The argument types.</param>
    /// <param name="returnType">The return type.</param>
    /// <returns>The method info.</returns>
    public static MethodInfo? GetGenericMethod(
        this Type t,
        string name,
        Type[] genericArgTypes,
        Type[] argTypes,
        Type? returnType = null
    )
    {
        MethodInfo? res = (
            from m in t.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static)
            where
                m.Name == name
                && m.GetGenericArguments().Length == genericArgTypes.Length
                && m.GetParameters().Select(pi => pi.ParameterType).All(d => argTypes.Any(a => a.IsAssignableTo(d)))
                && (m.ReturnType == returnType || returnType == null)
            select m
        ).FirstOrDefault();

        return res;
    }

    /// <summary>
    /// Invoke an async static generic method.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="genericTypes">The generic types.</param>
    /// <param name="returnType">The return type.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns></returns>
    public static Task<dynamic>? InvokeGenericMethodAsync(
        this Type type,
        string methodName,
        Type[] genericTypes,
        Type? returnType = null,
        params object[] parameters
    )
    {
        dynamic? awaitable = InvokeGenericMethod(type, methodName, genericTypes, returnType, parameters);

        return awaitable;
    }

    /// <summary>
    /// Invoke a static method.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The result.</returns>
    public static dynamic InvokeMethod(this Type type, string methodName, params object[] parameters)
    {
        var method = type.GetMethods(BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Static)
            .Where(x => x.Name == methodName)
            .FirstOrDefault(x =>
                x.GetParameters().Select(p => p.ParameterType).All(parameters.Select(p => p.GetType()).Contains)
            );

        if (method is null)
        {
            return null!;
        }

        return method.Invoke(null, parameters) ?? throw new InvalidOperationException("Method not found.");
    }

    /// <summary>
    /// Invokes the static factory or constructor of the specified type with the given parameters.
    /// </summary>
    /// <param name="type">The type to create an instance of.</param>
    /// <param name="parameters">The parameters to pass to the constructor.</param>
    /// <returns>The created instance, or null if no suitable constructor is found.</returns>
    public static object InvokeCreateStaticFactory(this Type type, params object[] parameters)
    {
        var instance =
            type.GetMethod("Create", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                ?.Invoke(null, parameters)
            ?? throw new InvalidOperationException(
                $"No suitable constructor or static method found for type {type.Name}"
            );
        return instance;
    }

    /// <summary>
    /// Invoke a async static method.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="methodName">The method name.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The awaitable.</returns>
    public static Task<dynamic> InvokeMethodAsync(this Type type, string methodName, params object[] parameters)
    {
        dynamic awaitable = InvokeMethod(type, methodName, parameters);

        return awaitable;
    }

    /// <summary>
    /// Get the cache key for a type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The cache key.</returns>
    public static string GetCacheKey(this Type type)
    {
        return _typeCacheKeys.GetOrAdd(type, t => $"{t.PrettyPrint()}");
    }

    /// <summary>
    /// This Method extends the System.Type-type to get all extended methods. It searches hereby in all assemblies which are known by the current AppDomain.
    /// </summary>
    /// <param name="t">The type.</param>
    /// <remarks>
    /// Inspired by Jon Skeet from his answer on http://stackoverflow.com/questions/299515/c-sharp-reflection-to-identify-extension-methods.
    /// </remarks>
    /// <returns>returns MethodInfo[] with the extended Method.</returns>
    public static MethodInfo[] GetExtensionMethods(this Type t)
    {
        var assTypes = new List<Type>();

        foreach (var item in AppDomain.CurrentDomain.GetAssemblies())
        {
            assTypes.AddRange(item.GetTypes());
        }

        var query =
            from type in assTypes
            where type.IsSealed && !type.IsGenericType && !type.IsNested
            from method in type.GetMethods(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
            where method.IsDefined(typeof(ExtensionAttribute), false)
            where method.GetParameters()[0].ParameterType == t
            select method;
        return query.ToArray<MethodInfo>();
    }

    /// <summary>
    /// This Method extends the System.Type-type to get a specific extended method. It searches hereby in all assemblies which are known by the current AppDomain.
    /// </summary>
    /// <param name="t">The type.</param>
    /// <param name="methodName">The name of the method.</param>
    /// <returns>The method info.</returns>
    public static MethodInfo? GetExtensionMethod(this Type t, string methodName)
    {
        var mi = from method in t.GetExtensionMethods() where method.Name == methodName select method;
        var methodInfos = mi as MethodInfo[] ?? mi.ToArray();
        return methodInfos.Length == 0 ? null : methodInfos.First();
    }

    /// <summary>
    /// This method make the type print pretty.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="depth">The depth.</param>
    /// <returns>The pretty print.</returns>
    public static string PrettyPrintRecursive(Type type, int depth)
    {
        if (depth > 3)
        {
            return type.Name;
        }

        var nameParts = type.Name.Split('`');
        if (nameParts.Length == 1)
        {
            return nameParts[0];
        }

        var genericArguments = type.GetTypeInfo().GetGenericArguments();
        return !type.IsConstructedGenericType
            ? $"{nameParts[0]}<{new string(',', genericArguments.Length - 1)}>"
            : $"{
                       nameParts[0]
                   }<{
                       string.Join(",", genericArguments.Select(t => PrettyPrintRecursive(t, depth + 1)))
                   }>";
    }

    /// <summary>
    /// This method will get all implemented types of a specific interface of assemblies.
    /// </summary>
    /// <param name="openGenericType">The open generic type.</param>
    /// <param name="assemblies">The assemblies.</param>
    /// <returns>The types.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingOpenGenericInterface(
        this Type openGenericType,
        params Assembly[] assemblies
    )
    {
        var inputAssemblies = assemblies.Length != 0 ? assemblies : AppDomain.CurrentDomain.GetAssemblies();
        return inputAssemblies.SelectMany(assembly =>
            GetAllTypesImplementingOpenGenericInterface(openGenericType, assembly)
        );
    }

    /// <summary>
    /// This method will get all implemented types of a specific interface of an assembly.
    /// </summary>
    /// <param name="openGenericType">The open generic type.</param>
    /// <param name="assembly">The assembly.</param>
    /// <returns>The types.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingOpenGenericInterface(
        this Type openGenericType,
        Assembly assembly
    )
    {
        try
        {
            return GetAllTypesImplementingOpenGenericInterface(openGenericType, assembly.GetTypes());
        }
        catch (ReflectionTypeLoadException)
        {
            return [];
        }
    }

    /// <summary>
    /// This method will get all implemented types of a specific interface of types.
    /// </summary>
    /// <param name="openGenericType">The open generic type.</param>
    /// <param name="types">The types.</param>
    /// <returns>The type enumerable.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingOpenGenericInterface(
        this Type openGenericType,
        IEnumerable<Type> types
    )
    {
        return from type in types
            from interfaceType in type.GetInterfaces()
            where
                interfaceType.IsGenericType
                && openGenericType.IsAssignableFrom(interfaceType.GetGenericTypeDefinition())
                && type.IsClass
                && !type.IsAbstract
            select type;
    }

    /// <summary>
    /// This method will get all the implementing types of a specific interface of assemblies.
    /// </summary>
    /// <param name="interfaceType">The interface type.</param>
    /// <param name="assemblies">The assemblies.</param>
    /// <returns>The types.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingInterface(
        this Type interfaceType,
        params Assembly[] assemblies
    )
    {
        var inputAssemblies = assemblies.Length != 0 ? assemblies : AppDomain.CurrentDomain.GetAssemblies();
        return inputAssemblies.SelectMany(assembly => GetAllTypesImplementingInterface(interfaceType, assembly));
    }

    /// <summary>
    /// This method will get all the implementing types of a specific interface of an assembly.
    /// </summary>
    /// <param name="interfaceType">The interface type.</param>
    /// <param name="assembly">The assembly.</param>
    /// <returns>The types.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingInterface(this Type interfaceType, Assembly assembly)
    {
        return assembly
            .GetTypes()
            .Where(type =>
                interfaceType.IsAssignableFrom(type) && type is { IsInterface: false, IsAbstract: false, IsClass: true }
            );
    }

    /// <summary>
    /// This method will find properties with a specific attribute of a type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="attribute">The attribute.</param>
    /// <returns>The properties.</returns>
    public static PropertyInfo[] FindPropertiesWithAttribute(this Type type, Type attribute)
    {
        var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
        return properties.Where(x => x.GetCustomAttributes(attribute, true).Length != 0).ToArray();
    }

    /// <summary>
    /// This method will find type by attribute of an assembly.
    /// </summary>
    /// <param name="assembly">The assembly.</param>
    /// <param name="predicate">The predicate.</param>
    /// <typeparam name="TAttribute">The type of the attribute.</typeparam>
    /// <returns>The type.</returns>
    public static Type? FindTypeByAttribute<TAttribute>(this Assembly assembly, Func<TAttribute, bool> predicate)
    {
        return assembly
            .GetTypes()
            .FirstOrDefault(t => t.GetCustomAttributes(typeof(TAttribute), false).OfType<TAttribute>().Any(predicate));
    }

    /// <summary>
    /// This method will find type by interface of an assembly.
    /// </summary>
    /// <param name="assembly">The assembly.</param>
    /// <returns>The type.</returns>
    public static Type[] GetTypesByInterface<TInterface>(this Assembly assembly)
    {
        return [.. assembly.GetTypes().Where(t => t.IsAssignableTo(typeof(TInterface)))];
    }

    /// <summary>
    /// This method will find properties of a specific object.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="obj">The object.</param>
    /// <returns>The properties.</returns>
    public static PropertyInfo[] FindPropertiesOfObject(this Type type, object obj)
    {
        var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
        return properties.Where(p => p.GetValue(obj) is not null).ToArray();
    }

    /// <summary>
    /// This method will get inherited types of a specific type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="toBaseType">The to base type.</param>
    /// <returns>The types.</returns>
    public static Type[] GetTypeInheritanceChainTo(this Type type, Type toBaseType)
    {
        var retVal = new List<Type> { type };
        var baseType = type.BaseType;
        while (baseType != toBaseType && baseType != typeof(object))
        {
            if (baseType == null)
            {
                continue;
            }

            retVal.Add(baseType);
            baseType = baseType.BaseType;
        }

        return [.. retVal];
    }

    /// <summary>
    /// This method checks if a type is a derivative of another type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="typeToCompare">The type to compare.</param>
    /// <returns>The result.</returns>
    /// <exception cref="ArgumentNullException">The type is null.</exception>
    public static bool IsDerivativeOf(this Type type, Type typeToCompare)
    {
        ArgumentNullException.ThrowIfNull(type);

        var retVal = type.BaseType != null;
        if (retVal)
        {
            retVal = type.BaseType == typeToCompare;
        }

        if (!retVal && type.BaseType != null)
        {
            retVal = type.BaseType.IsDerivativeOf(typeToCompare);
        }

        return retVal;
    }

    /// <summary>
    /// This method will create a new instance of a type.
    /// </summary>
    /// <typeparam name="T">The type.</typeparam>
    /// <param name="type">The type to compare.</param>
    /// <param name="parameters">The parameters.</param>
    /// <returns>The instance.</returns>
    public static T? CreateInstanceFromType<T>(this Type type, params object[] parameters)
    {
        var instance = (T?)Activator.CreateInstance(type, parameters);

        return instance;
    }

    /// <summary>
    /// This Method checks if a type is dictionary.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The result.</returns>
    /// <exception cref="ArgumentNullException">The type is null.</exception>
    public static bool IsDictionary(this Type type)
    {
        ArgumentNullException.ThrowIfNull(type);

        var retVal = typeof(IDictionary).IsAssignableFrom(type);
        if (!retVal)
        {
            retVal = type.IsGenericType && typeof(IDictionary<,>).IsAssignableFrom(type.GetGenericTypeDefinition());
        }

        return retVal;
    }

    /// <summary>
    /// This Method checks if a type is assignable from a generic list.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The result.</returns>
    public static bool IsAssignableFromGenericList(this Type type)
    {
        return type.GetInterfaces()
            .Any(intType => intType.IsGenericType && intType.GetGenericTypeDefinition() == typeof(IList<>));
    }

    /// <summary>
    /// This Method checks if a class is not abstract.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="publicOnly">The public only.</param>
    /// <returns>The result.</returns>
    public static bool IsNonAbstractClass(this Type type, bool publicOnly)
    {
        var typeInfo = type.GetTypeInfo();

        if (typeInfo.IsSpecialName)
        {
            return false;
        }

        if (typeInfo is not { IsClass: true, IsAbstract: false })
        {
            return false;
        }

        if (typeInfo.IsDefined(typeof(CompilerGeneratedAttribute), inherit: true))
        {
            return false;
        }

        if (publicOnly)
        {
            return typeInfo.IsPublic || typeInfo.IsNestedPublic;
        }

        return true;
    }

    /// <summary>
    /// This Method gets the base types of a type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The result.</returns>
    public static IEnumerable<Type> GetBaseTypes(this Type type)
    {
        var typeInfo = type.GetTypeInfo();

        foreach (var implementedInterface in typeInfo.ImplementedInterfaces)
        {
            yield return implementedInterface;
        }

        var baseType = typeInfo.BaseType;

        while (baseType != null)
        {
            var baseTypeInfo = baseType.GetTypeInfo();

            yield return baseType;

            baseType = baseTypeInfo.BaseType;
        }
    }

    /// <summary>
    /// This Method checks if a type is in the namespace.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="namespace">The namespace.</param>
    /// <returns>The result.</returns>
    public static bool IsInNamespace(this Type type, string @namespace)
    {
        var typeNamespace = type.Namespace ?? string.Empty;

        if (@namespace.Length > typeNamespace.Length)
        {
            return false;
        }

        var typeSubNamespace = typeNamespace[..@namespace.Length];

        if (!typeSubNamespace.Equals(@namespace, StringComparison.Ordinal))
        {
            return false;
        }

        if (typeNamespace.Length == @namespace.Length)
        {
            return true;
        }

        return typeNamespace[@namespace.Length] == '.';
    }

    /// <summary>
    /// This Method checks if a type is in the exact namespace.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="namespace">The namespace.</param>
    /// <returns>The result.</returns>
    public static bool IsInExactNamespace(this Type type, string @namespace)
    {
        return string.Equals(type.Namespace, @namespace, StringComparison.Ordinal);
    }

    /// <summary>
    /// This Method checks if a type has a specific attribute.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="attributeType">The attribute type.</param>
    /// <returns>The result.</returns>
    public static bool HasAttribute(this Type type, Type attributeType)
    {
        return type.GetTypeInfo().IsDefined(attributeType, inherit: true);
    }

    /// <summary>
    /// This Method checks if a type has a specific generic attribute.
    /// </summary>
    /// <typeparam name="T">The type of the attribute.</typeparam>
    /// <param name="type">The type.</param>
    /// <param name="predicate">The predicate.</param>
    /// <returns>The result.</returns>
    public static bool HasAttribute<T>(this Type type, Func<T, bool> predicate)
        where T : Attribute
    {
        return type.GetTypeInfo().GetCustomAttributes<T>(inherit: true).Any(predicate);
    }

    /// <summary>
    /// This method checks if a type is assignable to another type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="otherType">The other type.</param>
    /// <returns>The result.</returns>
    public static bool IsAssignableTo(this Type type, Type otherType)
    {
        var typeInfo = type.GetTypeInfo();
        var otherTypeInfo = otherType.GetTypeInfo();

        return otherTypeInfo.IsGenericTypeDefinition
            ? typeInfo.IsAssignableToGenericTypeDefinition(otherTypeInfo)
            : otherTypeInfo.IsAssignableFrom(typeInfo);
    }

    /// <summary>
    /// Determines if the type represented by the current TypeInfo object is assignable to the generic type definition represented by the specified TypeInfo object.
    /// </summary>
    /// <param name="typeInfo">The type information.</param>
    /// <param name="genericTypeInfo">The generic type information.</param>
    /// <returns><c>true</c> if the type is assignable to the generic type definition; otherwise, <c>false</c>.</returns>
    public static bool IsAssignableToGenericTypeDefinition(this TypeInfo typeInfo, TypeInfo genericTypeInfo)
    {
        var interfaceTypes = typeInfo.ImplementedInterfaces.Select(t => t.GetTypeInfo());

        if (
            (
                from interfaceType in interfaceTypes
                where interfaceType.IsGenericType
                select interfaceType.GetGenericTypeDefinition().GetTypeInfo()
            ).Any(typeDefinitionTypeInfo => typeDefinitionTypeInfo.Equals(genericTypeInfo))
        )
        {
            return true;
        }

        if (typeInfo.IsGenericType)
        {
            var typeDefinitionTypeInfo = typeInfo.GetGenericTypeDefinition().GetTypeInfo();

            if (typeDefinitionTypeInfo.Equals(genericTypeInfo))
            {
                return true;
            }
        }

        var baseTypeInfo = typeInfo.BaseType?.GetTypeInfo();

        return baseTypeInfo is not null && baseTypeInfo.IsAssignableToGenericTypeDefinition(genericTypeInfo);
    }

    /// <summary>
    /// Gets the implemented interfaces to map.
    /// </summary>
    /// <param name="typeInfo">The type information.</param>
    /// <returns>The implemented interfaces to map.</returns>
    public static IEnumerable<Type> GetImplementedInterfacesToMap(TypeInfo typeInfo)
    {
        if (!typeInfo.IsGenericType)
        {
            return typeInfo.ImplementedInterfaces;
        }

        return !typeInfo.IsGenericTypeDefinition
            ? typeInfo.ImplementedInterfaces
            : FilterMatchingGenericInterfaces(typeInfo);
    }

    /// <summary>
    /// Filters the matching generic interfaces.
    /// </summary>
    /// <param name="typeInfo">The type information.</param>
    /// <returns>The matching generic interfaces.</returns>
    public static IEnumerable<Type> FilterMatchingGenericInterfaces(TypeInfo typeInfo)
    {
        var genericTypeParameters = typeInfo.GenericTypeParameters;

        foreach (var current in typeInfo.ImplementedInterfaces)
        {
            var currentTypeInfo = current.GetTypeInfo();

            if (
                currentTypeInfo is { IsGenericType: true, ContainsGenericParameters: true }
                && GenericParametersMatch(genericTypeParameters, currentTypeInfo.GenericTypeArguments)
            )
            {
                yield return currentTypeInfo.GetGenericTypeDefinition();
            }
        }
    }

    /// <summary>
    /// Determines whether the generic parameters match.
    /// </summary>
    /// <param name="parameters">The parameters.</param>
    /// <param name="interfaceArguments">The interface arguments.</param>
    /// <returns>
    ///   <c>true</c> if the generic parameters match; otherwise, <c>false</c>.
    /// </returns>
    public static bool GenericParametersMatch(IReadOnlyList<Type> parameters, IReadOnlyList<Type> interfaceArguments)
    {
        if (parameters.Count != interfaceArguments.Count)
        {
            return false;
        }

        return !parameters.Where((t, i) => t != interfaceArguments[i]).Any();
    }

    /// <summary>
    /// Determines if the type is an open generic type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns><c>true</c> if the type is an open generic type; otherwise, <c>false</c>.</returns>
    public static bool IsOpenGeneric(this Type type)
    {
        return type.GetTypeInfo().IsGenericTypeDefinition;
    }

    /// <summary>
    /// Determines whether the type has matching generic arity.
    /// </summary>
    /// <param name="interfaceType">Type of the interface.</param>
    /// <param name="typeInfo">The type information.</param>
    /// <returns><c>true</c> if the type has matching generic arity; otherwise, <c>false</c>.</returns>
    public static bool HasMatchingGenericArity(this Type interfaceType, TypeInfo typeInfo)
    {
        if (!typeInfo.IsGenericType)
        {
            return true;
        }

        var interfaceTypeInfo = interfaceType.GetTypeInfo();

        if (!interfaceTypeInfo.IsGenericType)
        {
            return false;
        }

        var argumentCount = interfaceType.GenericTypeArguments.Length;
        var parameterCount = typeInfo.GenericTypeParameters.Length;

        return argumentCount == parameterCount;
    }

    /// <summary>
    /// Determines whether the type is a primitive type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns><c>true</c> if the type is a primitive type; otherwise, <c>false</c>.</returns>
    public static bool IsPrimitive(this Type type)
    {
        if (type == typeof(string))
        {
            return true;
        }

        return type.IsValueType || type.IsPrimitive;
    }

    /// <summary>
    /// Unwraps the nullable type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The underlying type if nullable; otherwise, the original type.</returns>
    public static Type UnwrapNullableType(this Type type) => Nullable.GetUnderlyingType(type) ?? type;

    /// <summary>
    /// Determines whether the type is nullable.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns><c>true</c> if the type is nullable; otherwise, <c>false</c>.</returns>
    public static bool IsNullableType(this Type type)
    {
        var typeInfo = type.GetTypeInfo();

        return !(
            typeInfo.IsValueType
            && (!typeInfo.IsGenericType || typeInfo.GetGenericTypeDefinition() != typeof(Nullable<>))
        );
    }

    /// <summary>
    /// Unwraps the enum type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The underlying enum type if nullable; otherwise, the original type.</returns>
    public static Type UnwrapEnumType(this Type type)
    {
        var isNullable = type.IsNullableType();
        var underlyingNonNullableType = isNullable ? type.UnwrapNullableType() : type;
        if (!underlyingNonNullableType.GetTypeInfo().IsEnum)
        {
            return type;
        }

        var underlyingEnumType = Enum.GetUnderlyingType(underlyingNonNullableType);
        return isNullable ? MakeNullable(underlyingEnumType) : underlyingEnumType;
    }

    /// <summary>
    /// Makes the type nullable.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="nullable">if set to <c>true</c>, makes the type nullable; otherwise, makes it non-nullable.</param>
    /// <returns>The nullable type if nullable is <c>true</c>; otherwise, the underlying type.</returns>
    public static Type MakeNullable(this Type type, bool nullable = true) =>
        type.IsNullableType() == nullable ? type
        : nullable ? typeof(Nullable<>).MakeGenericType(type)
        : type.UnwrapNullableType();

    /// <summary>
    /// Adds implementations as transient services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="openMessageInterfaces">The array of open message interfaces.</param>
    /// <param name="services">The service collection.</param>
    /// <param name="assembliesToScan">The assemblies to scan for implementations.</param>
    /// <param name="addIfAlreadyExists">Whether to add the service if it already exists.</param>
    public static void AddImplementationsAsTransient(
        this Type[] openMessageInterfaces,
        IServiceCollection services,
        IEnumerable<Assembly> assembliesToScan,
        bool addIfAlreadyExists
    )
    {
        foreach (var openInterface in openMessageInterfaces)
        {
            List<Type> concretions = [];
            List<Type> interfaces = [];

            if (assembliesToScan is Assembly[] toScan)
            {
                foreach (var type in toScan.SelectMany(a => a.DefinedTypes))
                {
                    var interfaceTypes = type.FindInterfacesThatClose(openInterface).ToArray();
                    if (interfaceTypes.Length == 0)
                    {
                        continue;
                    }

                    if (type.IsConcrete())
                    {
                        concretions.Add(type);
                    }

                    foreach (var interfaceType in interfaceTypes)
                    {
                        if (interfaceType != null && interfaceType.GetInterfaces().Length != 0)
                        {
                            interfaces.AddRange(interfaceType.GetInterfaces());
                        }
                        else
                        {
                            interfaces!.Fill(interfaceType);
                        }
                    }
                }
            }

            foreach (var @interface in interfaces.Distinct())
            {
                var matches = concretions.Where(t => t.CanBeCastTo(@interface)).ToList();

                if (addIfAlreadyExists)
                {
                    matches.ForEach(match => services.AddTransient(@interface, match));
                }
                else
                {
                    if (matches.Count > 1)
                    {
                        matches.RemoveAll(m => !IsMatchingWithInterface(m, @interface));
                    }

                    matches.ForEach(match => services.TryAddTransient(@interface, match));
                }

                if (!@interface.IsOpenGeneric())
                {
                    AddConcretionsThatCouldBeClosed(@interface, concretions, services);
                }
            }
        }
    }

    /// <summary>
    /// Adds implementations as transient services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <typeparam name="TInterface"></typeparam>
    /// <param name="openMessageInterfaces">The array of open message interfaces.</param>
    /// <param name="services">The service collection.</param>
    public static void AddImplementationsAsTransient<TInterface>(
        this TypeInfo[] openMessageInterfaces,
        IServiceCollection services
    )
    {
        var serviceDescriptors = ReflectionUtilities
            .GetAllImplementingTypes<TInterface>(openMessageInterfaces)
            .Select(type => ServiceDescriptor.Transient(typeof(TInterface), type))
            .ToArray();

        services.TryAddEnumerable(serviceDescriptors);
    }

    /// <summary>
    /// Adds implementations as transient services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <typeparam name="TInterface"></typeparam>
    /// <param name="openMessageInterfaces">The array of open message interfaces.</param>
    /// <param name="services">The service collection.</param>
    public static void AddAsTransient<TInterface>(this TypeInfo[] openMessageInterfaces, IServiceCollection services)
    {
        var types = ReflectionUtilities.GetAllImplementingTypes<TInterface>(openMessageInterfaces);
        foreach (var type in types)
        {
            services.AddTransient(type);
        }
    }

    /// <summary>
    /// Adds implementations as transient services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <typeparam name="TInterface"></typeparam>
    /// <param name="assembly">The assembly.</param>
    /// <param name="services">The service collection.</param>
    public static void AddImplementationsAsTransient<TInterface>(this Assembly assembly, IServiceCollection services)
    {
        var serviceDescriptors = ReflectionUtilities
            .GetAllImplementingTypes<TInterface>(assembly)
            .Select(type => ServiceDescriptor.Transient(typeof(TInterface), type))
            .ToArray();

        services.TryAddEnumerable(serviceDescriptors);
    }

    /// <summary>
    /// Adds implementations as transient services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <typeparam name="TInterface"></typeparam>
    /// <param name="assembly">The assembly.</param>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    public static void AddAs<TInterface>(
        this Assembly assembly,
        IServiceCollection services,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
    {
        var types = ReflectionUtilities.GetAllImplementingTypes<TInterface>(assembly);
        foreach (var type in types)
        {
            switch (serviceLifetime)
            {
                case ServiceLifetime.Singleton:
                    services.AddSingleton(type);
                    break;
                case ServiceLifetime.Scoped:
                    services.AddScoped(type);
                    break;
                case ServiceLifetime.Transient:
                    services.AddTransient(type);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(serviceLifetime), serviceLifetime, message: null);
            }
        }
    }

    /// <summary>
    /// Fills the list with the specified value if it does not already contain it.
    /// </summary>
    /// <typeparam name="T">The type of elements in the list.</typeparam>
    /// <param name="list">The list to fill.</param>
    /// <param name="value">The value to fill the list with.</param>
    public static void Fill<T>(this IList<T> list, T value)
    {
        if (list.Contains(value))
        {
            return;
        }

        list.Add(value);
    }

    /// <summary>
    /// Determines whether the given type is assignable to the specified generic type.
    /// </summary>
    /// <param name="givenType">The given type.</param>
    /// <param name="genericType">The generic type.</param>
    /// <returns><c>true</c> if the given type is assignable to the specified generic type; otherwise, <c>false</c>.</returns>
    public static bool IsAssignableToGenericType(this Type? givenType, Type? genericType)
    {
        if (givenType == null || genericType == null)
        {
            return false;
        }

        return givenType == genericType
            || givenType.MapsToGenericTypeDefinition(genericType)
            || givenType.HasInterfaceThatMapsToGenericTypeDefinition(genericType)
            || givenType.BaseType.IsAssignableToGenericType(genericType);
    }

    /// <summary>
    /// Checks if the given type has an interface that maps to the specified generic type definition.
    /// </summary>
    /// <param name="givenType">The given type.</param>
    /// <param name="genericType">The generic type definition.</param>
    /// <returns><c>true</c> if the given type has an interface that maps to the specified generic type definition; otherwise, <c>false</c>.</returns>
    public static bool HasInterfaceThatMapsToGenericTypeDefinition(this Type givenType, Type genericType)
    {
        return givenType
            .GetInterfaces()
            .Where(it => it.IsGenericType)
            .Any(it => it.GetGenericTypeDefinition() == genericType);
    }

    /// <summary>
    /// Checks if the given type maps to the specified generic type definition.
    /// </summary>
    /// <param name="givenType">The given type.</param>
    /// <param name="genericType">The generic type definition.</param>
    /// <returns><c>true</c> if the given type maps to the specified generic type definition; otherwise, <c>false</c>.</returns>
    public static bool MapsToGenericTypeDefinition(this Type givenType, Type genericType)
    {
        return genericType.IsGenericTypeDefinition
            && givenType.IsGenericType
            && givenType.GetGenericTypeDefinition() == genericType;
    }

    /// <summary>
    /// Checks if the given type is a record type.
    /// </summary>
    /// <param name="objectType">The type to check.</param>
    /// <returns><c>true</c> if the given type is a record type; otherwise, <c>false</c>.</returns>
    public static bool IsRecord(this Type objectType)
    {
        return objectType.GetMethod("<Clone>$") != null
            || ((TypeInfo)objectType)
                .DeclaredProperties.FirstOrDefault(x => x.Name == "EqualityContract")
                ?.GetMethod?.GetCustomAttribute(typeof(CompilerGeneratedAttribute)) != null;
    }

    /// <summary>
    /// Checks if the given type matches with the specified interface.
    /// </summary>
    /// <param name="handlerType">The handler type.</param>
    /// <param name="handlerInterface">The handler interface.</param>
    /// <returns><c>true</c> if the given type matches with the specified interface; otherwise, <c>false</c>.</returns>
    public static bool IsMatchingWithInterface(Type? handlerType, Type? handlerInterface)
    {
        while (true)
        {
            if (handlerType == null || handlerInterface == null)
            {
                return false;
            }

            if (handlerType.IsInterface)
            {
                if (handlerType.GenericTypeArguments.SequenceEqual(handlerInterface.GenericTypeArguments))
                {
                    return true;
                }
            }
            else
            {
                handlerType = handlerType.GetInterface(handlerInterface.Name);
                continue;
            }

            return false;
        }
    }

    /// <summary>
    /// Adds concretions that could be closed to the specified interface as transient services to the service collection.
    /// </summary>
    /// <param name="interface">The interface.</param>
    /// <param name="concretions">The list of concretions.</param>
    /// <param name="services">The service collection.</param>
    public static void AddConcretionsThatCouldBeClosed(
        Type @interface,
        List<Type> concretions,
        IServiceCollection services
    )
    {
        foreach (var type in concretions.Where(x => x.IsOpenGeneric() && x.CouldCloseTo(@interface)))
        {
            services.TryAddTransient(@interface, type.MakeGenericType(@interface.GenericTypeArguments));
        }
    }

    /// <summary>
    /// Determines if the open concretion could close to the closed interface.
    /// </summary>
    /// <param name="openConcretion">The open concretion type.</param>
    /// <param name="closedInterface">The closed interface type.</param>
    /// <returns><c>true</c> if the open concretion could close to the closed interface; otherwise, <c>false</c>.</returns>
    public static bool CouldCloseTo(this Type openConcretion, Type closedInterface)
    {
        var openInterface = closedInterface.GetGenericTypeDefinition();
        var arguments = closedInterface.GenericTypeArguments;

        var concreteArguments = openConcretion.GenericTypeArguments;
        return arguments.Length == concreteArguments.Length && openConcretion.CanBeCastTo(openInterface);
    }

    /// <summary>
    /// Checks if the plugged type can be cast to the plugin type.
    /// </summary>
    /// <param name="pluggedType">The plugged type.</param>
    /// <param name="pluginType">The plugin type.</param>
    /// <returns><c>true</c> if the plugged type can be cast to the plugin type; otherwise, <c>false</c>.</returns>
    public static bool CanBeCastTo(this Type? pluggedType, Type pluginType)
    {
        if (pluggedType is null)
        {
            return false;
        }

        return pluggedType == pluginType || pluginType.GetTypeInfo().IsAssignableFrom(pluggedType.GetTypeInfo());
    }

    /// <summary>
    /// Finds interfaces that close to the specified template type.
    /// </summary>
    /// <param name="pluggedType">The plugged type.</param>
    /// <param name="templateType">The template type.</param>
    /// <returns>The collection of interfaces that close to the template type.</returns>
    public static IEnumerable<Type?> FindInterfacesThatClose(this Type pluggedType, Type templateType)
    {
        if (!pluggedType.IsConcrete())
        {
            yield break;
        }

        if (templateType.GetTypeInfo().IsInterface)
        {
            foreach (
                var interfaceType in pluggedType
                    .GetTypeInfo()
                    .ImplementedInterfaces.Where(type =>
                        type.GetTypeInfo().IsGenericType && type.GetGenericTypeDefinition() == templateType
                    )
            )
            {
                yield return interfaceType;
            }
        }
        else
        {
            var memberInfo = pluggedType.GetTypeInfo().BaseType;
            if (
                memberInfo != null
                && memberInfo.GetTypeInfo().IsGenericType
                && memberInfo.GetGenericTypeDefinition() == templateType
            )
            {
                yield return pluggedType.GetTypeInfo().BaseType;
            }
        }

        if (pluggedType == typeof(object))
        {
            yield break;
        }

        if (pluggedType.GetTypeInfo().BaseType == typeof(object))
        {
            yield break;
        }

        var baseType = pluggedType.GetTypeInfo().BaseType;
        if (baseType == null)
        {
            yield break;
        }

        {
            foreach (var interfaceType in FindInterfacesThatClose(baseType, templateType))
            {
                yield return interfaceType;
            }
        }
    }

    /// <summary>
    /// Checks if the given type is concrete.
    /// </summary>
    /// <param name="type">The type to check.</param>
    /// <returns><c>true</c> if the given type is concrete; otherwise, <c>false</c>.</returns>
    public static bool IsConcrete(this Type type)
    {
        return !type.GetTypeInfo().IsAbstract && !type.GetTypeInfo().IsInterface;
    }

    /// <summary>
    /// Gets the registration type based on the interface type and type information.
    /// </summary>
    /// <param name="interfaceType">The interface type.</param>
    /// <param name="typeInfo">The type information.</param>
    /// <returns>The registration type.</returns>
    public static Type GetRegistrationType(this Type interfaceType, TypeInfo typeInfo)
    {
        if (typeInfo.IsGenericTypeDefinition)
        {
            var interfaceTypeInfo = interfaceType.GetTypeInfo();

            if (interfaceTypeInfo.IsGenericType)
            {
                return interfaceType.GetGenericTypeDefinition();
            }
        }

        return interfaceType;
    }

    /// <summary>
    /// Gets the module name for the specified type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <returns>The module name.</returns>
    public static string GetModuleName(this Type? type)
    {
        if (type?.Namespace is null)
        {
            return string.Empty;
        }

        var moduleName = type.Assembly.GetName().Name;
        return type.Namespace.StartsWith(moduleName!, StringComparison.Ordinal)
            ? type.Namespace.Split(".")[2].ToLowerInvariant()
            : string.Empty;
    }

    /// <summary>
    /// Generates a human-readable representation of the type.
    /// </summary>
    /// <param name="type">The type to pretty print.</param>
    /// <returns>A human-readable representation of the type.</returns>
    public static string PrettyPrint(this Type type)
    {
        return _prettyPrintCache.GetOrAdd(
            type,
            t =>
            {
                try
                {
                    return PrettyPrintRecursive(t, 0);
                }
                catch (Exception c)
                {
                    Console.WriteLine(c);
                    return t.Name;
                }
            }
        );
    }

    /// <summary>
    /// Checks if the type has a method for applying a specific domain event.
    /// </summary>
    /// <typeparam name="TDomainEvent">The domain event type.</typeparam>
    /// <param name="type">The type to check.</param>
    /// <returns><c>true</c> if the type has an apply method for the domain event; otherwise, <c>false</c>.</returns>
    public static bool HasAggregateApplyMethod<TDomainEvent>(this Type type)
    {
        return type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
            .Any(mi =>
                mi.Name == "Apply"
                && mi.GetParameters().Length == 1
                && typeof(TDomainEvent).GetTypeInfo().IsAssignableFrom(mi.GetParameters()[0].ParameterType)
            );
    }

    /// <summary>
    /// Checks if the type has a method for applying a specific event type.
    /// </summary>
    /// <param name="type">The type to check.</param>
    /// <param name="eventType">The event type.</param>
    /// <returns><c>true</c> if the type has an apply method for the event type; otherwise, <c>false</c>.</returns>
    public static bool HasAggregateApplyMethod(this Type type, Type eventType)
    {
        return type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
            .Any(mi =>
                mi.Name == "Apply"
                && mi.GetParameters().Length == 1
                && eventType.GetTypeInfo().IsAssignableFrom(mi.GetParameters()[0].ParameterType)
            );
    }

    /// <summary>
    /// Compiles a method invocation of the specified type and method name with the given method signature.
    /// </summary>
    /// <typeparam name="TResult">The result type of the method invocation.</typeparam>
    /// <param name="type">The type that contains the method.</param>
    /// <param name="methodName">The name of the method.</param>
    /// <param name="methodSignature">The method signature.</param>
    /// <returns>The compiled method invocation.</returns>
    public static TResult CompileMethodInvocation<TResult>(
        this Type type,
        string methodName,
        params Type[]? methodSignature
    )
    {
        var typeInfo = type.GetTypeInfo();
        var methods = typeInfo
            .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
            .Where(m => m.Name == methodName);

        var methodInfo =
            methodSignature == null || methodSignature.Length == 0
                ? methods.SingleOrDefault()
                : methods.SingleOrDefault(m =>
                    m.GetParameters().Select(mp => mp.ParameterType).SequenceEqual(methodSignature)
                );

        return methodInfo == null
            ? throw new ArgumentException($"Type '{type.PrettyPrint()}' doesn't have a method called '{methodName}'")
            : ReflectionUtilities.CompileMethodInvocation<TResult>(methodInfo);
    }

    /// <summary>
    /// Finds a property with the specified name within the type hierarchy.
    /// </summary>
    /// <param name="type">The type to search.</param>
    /// <param name="propertyName">The name of the property.</param>
    /// <returns>The found property, or <c>null</c> if not found.</returns>
    public static PropertyInfo? FindProperty(this Type type, string propertyName)
    {
        PropertyInfo? res = null;
        foreach (var prop in propertyName.Split('.'))
        {
            res = res == null ? type.GetProperty(prop) : res.PropertyType.GetProperty(prop);
        }

        return res;
    }

    /// <summary>
    /// Gets the property value of the specified object.
    /// </summary>
    /// <param name="assembly">The assembly.</param>
    /// <param name="interfaceType">The interface type.</param>
    /// <returns>The property value.</returns>
    public static IEnumerable<Type> GetTypesImplementingGenericInterface(this Assembly assembly, Type interfaceType)
    {
        return assembly
            .GetTypes()
            .Where(type =>
                type is { IsClass: true, IsAbstract: false }
                && type.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == interfaceType)
            );
    }

    /// <summary>
    /// Gets a specific generic interface implemented by a type.
    /// </summary>
    /// <param name="type">The type to inspect.</param>
    /// <param name="genericTypeDefinition">The generic type definition to look for.</param>
    /// <returns>The matching generic interface, or <c>null</c> if not found.</returns>
    public static Type? GetGenericInterface(this Type type, Type genericTypeDefinition)
    {
        return type.GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == genericTypeDefinition);
    }

    /// <summary>
    /// Gets the generic argument of a specific generic interface implemented by a type.
    /// </summary>
    /// <param name="type">The type to inspect.</param>
    /// <param name="genericTypeDefinition">The generic type definition to look for.</param>
    /// <returns>The first generic argument of the interface, or <c>null</c> if not found.</returns>
    public static Type? GetGenericArgument(this Type type, Type genericTypeDefinition)
    {
        var genericInterface = type.GetGenericInterface(genericTypeDefinition);
        return genericInterface?.GetGenericArguments().FirstOrDefault();
    }

    /// <summary>
    /// Gets the generic argument of a specific generic interface implemented by a type.
    /// </summary>
    /// <param name="type">The type to inspect.</param>
    /// <returns>The first generic argument of the interface, or <c>null</c> if not found.</returns>
    public static Type GetGenericArgument(this Type type)
    {
        return type.GetInterfaces().First(i => i.IsGenericType).GetGenericArguments()[0];
    }
}
