using System.Linq.Expressions;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace BuildingBlocks.Core.Reflection;

/// <summary>
/// Provides utility methods for reflection.
/// </summary>
public static class ReflectionUtilities
{
    /// <summary>
    /// Creates an instance of a generic type with the specified type arguments and constructor arguments.
    /// </summary>
    /// <param name="genericType">The generic type definition.</param>
    /// <param name="typeArguments">An array of type arguments for the generic type.</param>
    /// <param name="constructorArgs">Optional constructor arguments for the created instance.</param>
    /// <returns>An instance of the generic type.</returns>
    public static dynamic? CreateGenericType(Type genericType, Type[] typeArguments, params object?[] constructorArgs)
    {
        var type = genericType.MakeGenericType(typeArguments);

        return Activator.CreateInstance(type, constructorArgs);
    }

    /// <summary>
    /// Creates an instance of a generic type with the specified type arguments and constructor arguments.
    /// </summary>
    /// <typeparam name="TGenericType">The generic type definition.</typeparam>
    /// <param name="typeArguments">An array of type arguments for the generic type.</param>
    /// <param name="constructorArgs">Optional constructor arguments for the created instance.</param>
    /// <returns>An instance of the generic type.</returns>
    public static dynamic? CreateGenericType<TGenericType>(Type[] typeArguments, params object?[] constructorArgs)
    {
        return CreateGenericType(typeof(TGenericType), typeArguments, constructorArgs);
    }

    /// <summary>
    /// Retrieves all types in the specified assemblies that implement a given interface.
    /// </summary>
    /// <typeparam name="TInterface">The interface type to search for.</typeparam>
    /// <param name="assemblies">Optional list of assemblies to search in. If not provided, uses all assemblies in the current AppDomain.</param>
    /// <returns>An IEnumerable of types implementing the specified interface.</returns>
    public static IEnumerable<Type> GetAllTypesImplementingInterface<TInterface>(params Assembly[] assemblies)
    {
        var inputAssemblies = assemblies.Length != 0 ? assemblies : AppDomain.CurrentDomain.GetAssemblies();
        return inputAssemblies.SelectMany(GetAllTypesImplementingInterface<TInterface>);
    }

    /// <summary>
    /// Retrieves all types in the specified assemblies that implement a given interface.
    /// </summary>
    /// <typeparam name="TInterface">The interface type to search for.</typeparam>
    /// <param name="assemblies">The assemblies to search in.</param>
    /// <returns>The IEnumerable of types implementing the specified interface.</returns>
    public static IEnumerable<TInterface> GetAllAndInstantiateImplementations<TInterface>(params Assembly[] assemblies)
    {
        var inputAssemblies = assemblies.Length != 0 ? assemblies : AppDomain.CurrentDomain.GetAssemblies();

        var types = inputAssemblies
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type =>
                typeof(TInterface).IsAssignableFrom(type) && type is { IsInterface: false, IsAbstract: false }
            );

        foreach (var type in types)
        {
            if (Activator.CreateInstance(type) is TInterface instance)
            {
                yield return instance;
            }
        }
    }

    /// <summary>
    /// Retrieves all types in the specified assemblies that implement a given interface.
    /// </summary>
    /// <param name="assemblies">The assemblies to search in.</param>
    /// <typeparam name="TInterface">The interface type to search for.</typeparam>
    /// <returns>The IEnumerable of types implementing the specified interface.</returns>
    public static IReadOnlyList<Type> GetAllImplementingTypes<TInterface>(params Assembly[] assemblies)
    {
        var inputAssemblies = assemblies.Length != 0 ? assemblies : AppDomain.CurrentDomain.GetAssemblies();
        return inputAssemblies
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type =>
                typeof(TInterface).IsAssignableFrom(type) && type is { IsInterface: false, IsAbstract: false }
            )
            .ToList();
    }

    /// <summary>
    /// Retrieves all types in the specified assemblies that implement a given interface.
    /// </summary>
    /// <param name="openMessageInterfaces">The open message interfaces to search in.</param>
    /// <typeparam name="TInterface">The interface type to search for.</typeparam>
    /// <returns>The IEnumerable of types implementing the specified interface.</returns>
    public static IReadOnlyList<Type> GetAllImplementingTypes<TInterface>(params TypeInfo[] openMessageInterfaces)
    {
        var types = openMessageInterfaces
            .Where(type =>
                typeof(TInterface).IsAssignableFrom(type) && type is { IsInterface: false, IsAbstract: false }
            )
            .ToList();

        return types;
    }

    /// <summary>
    /// Retrieves all types in the specified assemblies that implement a given interface.
    /// </summary>
    /// <typeparam name="TInterface"></typeparam>
    /// <param name="assembly">The assembly to search in.</param>
    /// <returns>The IEnumerable of types implementing the specified interface.</returns>
    private static IEnumerable<Type> GetAllTypesImplementingInterface<TInterface>(Assembly? assembly = null)
    {
        var inputAssembly = assembly ?? Assembly.GetExecutingAssembly();
        return inputAssembly
            .GetTypes()
            .Where(type =>
                typeof(TInterface).IsAssignableFrom(type)
                && type is { IsInterface: false, IsAbstract: false, IsClass: true }
            );
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <typeparam name="T">The type for which property names are retrieved.</typeparam>
    /// <param name="propertyExpressions">Array of property expressions for the type.</param>
    /// <returns>An IEnumerable of property names as strings.</returns>
    public static IReadOnlyList<string?> GetPropertyNames<T>(params Expression<Func<T, object>>[] propertyExpressions)
    {
        var retVal = new List<string?>();
        foreach (var propertyExpression in propertyExpressions)
        {
            retVal.Add(GetPropertyName(propertyExpression));
        }

        return retVal;
    }

    /// <summary>
    /// Retrieves the name of a property specified by a property expression.
    /// </summary>
    /// <typeparam name="T">The type of the property.</typeparam>
    /// <param name="propertyExpression">The property expression.</param>
    /// <returns>The name of the property as a string.</returns>
    public static string? GetPropertyName<T>(Expression<Func<T, object>>? propertyExpression)
    {
        string? retVal = null;
        if (propertyExpression is null)
        {
            return retVal;
        }

        var lambda = (LambdaExpression)propertyExpression;
        MemberExpression memberExpression = lambda.Body is UnaryExpression unaryExpression
            ? (MemberExpression)unaryExpression.Operand
            : (MemberExpression)lambda.Body;

        retVal = memberExpression.Member.Name;

        return retVal;
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <param name="typeName">The name of the type for which property names are retrieved.</param>
    /// <returns>The type of the property as a string.</returns>
    public static Type? GetTypeFromAnyReferencingAssembly(string typeName)
    {
        var referencedAssemblies = Assembly.GetEntryAssembly()?.GetReferencedAssemblies().Select(a => a.FullName);

        if (referencedAssemblies == null)
        {
            return null;
        }

        return AppDomain
            .CurrentDomain.GetAssemblies()
            .Where(a => referencedAssemblies.Contains(a.FullName))
            .SelectMany(a => a.GetTypes().Where(x => x.FullName == typeName || x.Name == typeName))
            .FirstOrDefault();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <param name="typeName">The name of the type for which property names are retrieved.</param>
    /// <returns>The type of the property as a string.</returns>
    public static Type? GetFirstMatchingTypeFromCurrentDomainAssemblies(string typeName)
    {
        return AppDomain
            .CurrentDomain.GetAssemblies()
            .SelectMany(a => a.GetTypes().Where(x => x.FullName == typeName || x.Name == typeName))
            .FirstOrDefault();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="methodInfo">The method information.</param>
    /// <returns>The compiled method invocation.</returns>
    public static TResult CompileMethodInvocation<TResult>(MethodInfo methodInfo)
    {
        var genericArguments = typeof(TResult).GetTypeInfo().GetGenericArguments();
        var methodArgumentList = methodInfo.GetParameters().Select(p => p.ParameterType).ToList();
        var funcArgumentList = genericArguments.Skip(1).Take(methodArgumentList.Count).ToList();

        if (funcArgumentList.Count != methodArgumentList.Count)
        {
            throw new ArgumentException("Incorrect number of arguments");
        }

        var instanceArgument = Expression.Parameter(genericArguments[0]);

        var argumentPairs = funcArgumentList
            .Zip(methodArgumentList, (s, d) => new { Source = s, Destination = d })
            .ToList();
        if (argumentPairs.All(a => a.Source == a.Destination))
        {
            var parameters = funcArgumentList.Select(Expression.Parameter).ToList();
            return Expression
                .Lambda<TResult>(
                    Expression.Call(instanceArgument, methodInfo, parameters),
                    new[] { instanceArgument }.Concat(parameters)
                )
                .Compile();
        }

        var lambdaArgument = new List<ParameterExpression> { instanceArgument };

        var type = methodInfo.DeclaringType!;
        var instanceVariable = Expression.Variable(type);
        var blockVariables = new List<ParameterExpression> { instanceVariable };
        var blockExpressions = new List<Expression>
        {
            Expression.Assign(instanceVariable, Expression.ConvertChecked(instanceArgument, type)),
        };
        var callArguments = new List<ParameterExpression>();

        foreach (var a in argumentPairs)
        {
            if (a.Source == a.Destination)
            {
                var sourceParameter = Expression.Parameter(a.Source);
                lambdaArgument.Add(sourceParameter);
                callArguments.Add(sourceParameter);
            }
            else
            {
                var sourceParameter = Expression.Parameter(a.Source);
                var destinationVariable = Expression.Variable(a.Destination);
                var assignToDestination = Expression.Assign(
                    destinationVariable,
                    Expression.Convert(sourceParameter, a.Destination)
                );

                lambdaArgument.Add(sourceParameter);
                callArguments.Add(destinationVariable);
                blockVariables.Add(destinationVariable);
                blockExpressions.Add(assignToDestination);
            }
        }

        var callExpression = Expression.Call(instanceVariable, methodInfo, callArguments);
        blockExpressions.Add(callExpression);

        var block = Expression.Block(blockVariables, blockExpressions);

        var lambdaExpression = Expression.Lambda<TResult>(block, lambdaArgument);

        return lambdaExpression.Compile();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <param name="rootAssembly">The root assembly.</param>
    /// <returns>The list of assemblies that are application parts.</returns>
    public static IReadOnlyList<Assembly> GetApplicationPartAssemblies(Assembly rootAssembly)
    {
        var rootNamespace = rootAssembly.GetName().Name!.Split('.').First();
        var list = rootAssembly
            .GetCustomAttributes<ApplicationPartAttribute>()
            .Where(x => x.AssemblyName.StartsWith(rootNamespace, StringComparison.InvariantCulture))
            .Select(name => Assembly.Load(name.AssemblyName))
            .Distinct();

        return list.ToList().AsReadOnly();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <returns>The list of assemblies that are application parts.</returns>
    public static IReadOnlyList<Assembly> GetBinDirectoryAssemblies()
    {
        var assemblies = Directory
            .GetFiles(AppDomain.CurrentDomain.BaseDirectory, "*.dll")
            .Select(x => Assembly.Load(AssemblyName.GetAssemblyName(x)))
            .Distinct();

        return assemblies.ToList().AsReadOnly();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <param name="rootAssembly">The root assembly.</param>
    /// <returns>The list of assemblies that are referenced by the root assembly.</returns>
    public static IReadOnlyList<Assembly> GetReferencedAssemblies(Assembly? rootAssembly)
    {
        var visited = new HashSet<string>();
        var queue = new Queue<Assembly?>();
        var listResult = new List<Assembly>();

        var root = rootAssembly ?? Assembly.GetEntryAssembly();
        queue.Enqueue(root);

        while (queue.Count != 0)
        {
            var asm = queue.Dequeue();

            if (asm == null)
            {
                break;
            }

            listResult.Add(asm);

            foreach (var reference in asm.GetReferencedAssemblies())
            {
                if (!visited.Contains(reference.FullName))
                {
                    queue.Enqueue(Assembly.Load(reference));
                    visited.Add(reference.FullName);
                }
            }
        }

        return listResult.Distinct().ToList().AsReadOnly();
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <typeparam name="T">The type of the root assembly.</typeparam>
    /// <returns>The list of assemblies that are referenced by the root assembly.</returns>
    public static IReadOnlyList<Assembly> GetReferencedAssembliesFromRootType<T>()
        where T : Type
    {
        var root = typeof(T).Assembly;
        return GetReferencedAssemblies(root);
    }

    /// <summary>
    /// Retrieves the names of properties specified by the given property expressions for a type.
    /// </summary>
    /// <param name="rootType">The root type.</param>
    /// <returns>The list of assemblies that are referenced by the root assembly.</returns>
    public static IReadOnlyList<Assembly> GetReferencedAssembliesFromRootType(Type rootType)
    {
        var root = rootType.Assembly;
        return GetReferencedAssemblies(root);
    }

    /// <summary>
    /// Gets the first generic argument of the base type if it matches the specified condition.
    /// </summary>
    /// <param name="type">The type to inspect.</param>
    /// <param name="baseCondition">A condition that the generic argument must satisfy.</param>
    /// <returns>The first generic argument if it exists and matches the condition; otherwise, null.</returns>
    public static Type? GetBaseTypeGenericArgumentIf(Type? type, Func<Type, bool> baseCondition)
    {
        var baseTypeGenericArgument = type?.BaseType?.GetGenericArguments().FirstOrDefault();
        return (baseTypeGenericArgument != null && baseCondition(baseTypeGenericArgument))
            ? baseTypeGenericArgument
            : null;
    }

    /// <summary>
    /// Dynamically invokes a static generic method with specified generic type arguments.
    /// </summary>
    /// <param name="targetType">The type that contains the method.</param>
    /// <param name="methodName">The name of the method to invoke.</param>
    /// <param name="bindingFlags">The binding flags to use in the method search.</param>
    /// <param name="genericTypeArguments">The generic type arguments for the method.</param>
    /// <param name="methodArguments">The arguments to pass to the method, if any.</param>
    /// <returns>The result of the method invocation, if any.</returns>
    public static object? InvokeGenericMethod(
        Type targetType,
        string methodName,
        BindingFlags bindingFlags,
        Type[] genericTypeArguments,
        object[] methodArguments
    )
    {
        var method = targetType.GetMethod(methodName, bindingFlags);
        if (method == null)
        {
            throw new InvalidOperationException($"Method '{methodName}' not found.");
        }

        var genericMethod = method.MakeGenericMethod(genericTypeArguments);
        return genericMethod.Invoke(null, methodArguments);
    }
}
