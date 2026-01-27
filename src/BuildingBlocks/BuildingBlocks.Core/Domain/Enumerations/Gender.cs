using System.Text.Json.Serialization;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Enumerations;

/// <summary>
/// Represents the types of genders.
/// </summary>
public sealed class Gender : Enumeration
{
    #region Seed

    /// <summary>
    /// Represents a Male gender type.
    /// </summary>
    public static readonly Gender Male = new(1, nameof(Male));

    /// <summary>
    /// Represents a Female gender type.
    /// </summary>
    public static readonly Gender Female = new(2, nameof(Female));

    /// <summary>
    /// Represents Other gender type.
    /// </summary>
    public static readonly Gender Other = new(3, nameof(Other));

    #endregion

    #region Constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="Gender"/> class.
    /// </summary>
    /// <param name="id">The unique identifier for the gender type.</param>
    /// <param name="name">The name of the gender type.</param>
    [JsonConstructor]
    private Gender(int id, string name)
        : base(id, name) { }

    #endregion
}
