using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.Enumerations.Rules;

/// <summary>
/// Represents a business rule that checks if an enumeration is defined.
/// </summary>
/// <param name="enumValue">The value of the enumeration.</param>
/// <typeparam name="T">The type of the enumeration.</typeparam>
public sealed class EnumerationMustBeDefinedRule<T>(int enumValue) : IBusinessRule
    where T : Enumeration
{
    /// <inheritdoc />
    public bool IsBroken() => Enumeration.GetAll<T>().All(e => e.Id != enumValue);

    /// <inheritdoc />
    public string Message => SharedResource.Invalid_Data_Error_Message;
}

/// <summary>
/// Represents the enum must be defined rule.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="EnumMustBeDefinedRule{T}"/> class.
/// </remarks>
/// <param name="type">The type.</param>
public sealed class EnumMustBeDefinedRule<T>(T type) : IBusinessRule
    where T : Enum
{
    /// <inheritdoc />
    public bool IsBroken() => !Enum.IsDefined(typeof(T), type);

    /// <inheritdoc />
    public string Message => SharedResource.Invalid_Data_Error_Message;
}
