using Mono.Cecil;
using NetArchTest.Rules;

namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Custom rule for checking return types.
/// </summary>
/// <param name="expectedReturnType">The expected return type.</param>
public sealed class ReturnTypeRule(Type expectedReturnType) : ICustomRule
{
    /// <inheritdoc />
    public bool MeetsRule(TypeDefinition type)
    {
        var handleMethod = type.Methods.FirstOrDefault(m => string.Equals(m.Name, "Handle", StringComparison.Ordinal));
        if (handleMethod == null)
        {
            return false;
        }

        var returnType = handleMethod.ReturnType;
        if (returnType is GenericInstanceType genericReturnType)
        {
            if (
                string.Equals(genericReturnType.ElementType.FullName, typeof(Task<>).FullName, StringComparison.Ordinal)
            )
            {
                var taskArgument = genericReturnType.GenericArguments[0];
                if (taskArgument is GenericInstanceType genericTaskArgument)
                {
                    return string.Equals(
                        genericTaskArgument.ElementType.FullName,
                        expectedReturnType.FullName,
                        StringComparison.Ordinal
                    );
                }
            }
        }

        return false;
    }
}
